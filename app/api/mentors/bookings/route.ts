// app/api/mentors/bookings/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const bookSchema = z.object({
  mentorProfileId: z.string().uuid(),
  subject: z.string().min(5).max(200),
  message: z.string().min(20).max(2000),
  durationMins: z.number().min(30).max(180).default(60),
});

// POST /api/mentors/bookings — request a session
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = bookSchema.parse(body);

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: data.mentorProfileId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!mentorProfile) return NextResponse.json({ success: false, message: 'Mentor not found' }, { status: 404 });
    if (!mentorProfile.isActive) return NextResponse.json({ success: false, message: 'This mentor is not currently taking sessions' }, { status: 400 });
    if (mentorProfile.userId === user.userId) return NextResponse.json({ success: false, message: 'You cannot book yourself' }, { status: 400 });

    const booking = await prisma.mentorBooking.create({
      data: {
        mentorProfileId: data.mentorProfileId,
        menteeId: user.userId,
        mentorUserId: mentorProfile.userId,
        subject: data.subject,
        message: data.message,
        durationMins: data.durationMins,
      },
    });

    // In-app notification for mentor
    const mentee = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        recipientId: mentorProfile.userId,
        senderId: user.userId,
        type: 'MENTOR_BOOKING_RECEIVED',
        title: 'New Session Request',
        body: `${mentee?.name || 'A student'} has requested a ${data.durationMins}-min session on "${data.subject}"`,
        linkUrl: '/vidya-setu/bookings',
        metadata: { bookingId: booking.id },
      },
    });

    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vidya-setu/bookings`;
    sendEmail.mentorBookingReceived(
      mentorProfile.user.name || mentorProfile.user.email,
      mentee?.name || 'A student',
      data.subject,
      data.message,
      bookingUrl,
      mentorProfile.user.email,
    ).catch(console.error);

    return NextResponse.json({ success: true, data: { booking } }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to create booking' }, { status: 500 });
  }
}

// GET /api/mentors/bookings?role=mentee|mentor
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const role = new URL(request.url).searchParams.get('role') || 'mentee';

    const where = role === 'mentor' ? { mentorUserId: user.userId } : { menteeId: user.userId };

    const bookings = await prisma.mentorBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        mentorProfile: {
          include: { user: { select: { id: true, name: true, profilePicture: true } } },
        },
        mentee: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    return NextResponse.json({ success: true, data: { bookings } });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// PATCH /api/mentors/bookings — confirm, cancel, add meeting link, or rate
const updateSchema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(['CONFIRM', 'CANCEL', 'SET_LINK', 'COMPLETE', 'RATE']),
  meetingLink: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
  menteeRating: z.number().min(1).max(5).optional(),
  menteeReview: z.string().max(1000).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { bookingId, action, meetingLink, scheduledAt, menteeRating, menteeReview } = updateSchema.parse(body);

    const booking = await prisma.mentorBooking.findUnique({
      where: { id: bookingId },
      include: {
        mentee: { select: { id: true, name: true, email: true } },
        mentorProfile: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!booking) return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });

    const isMentor = booking.mentorUserId === user.userId;
    const isMentee = booking.menteeId === user.userId;

    if (action === 'CONFIRM') {
      if (!isMentor) return NextResponse.json({ success: false, message: 'Only the mentor can confirm' }, { status: 403 });
      await prisma.mentorBooking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED', scheduledAt: scheduledAt ? new Date(scheduledAt) : null, meetingLink },
      });
      await prisma.notification.create({
        data: {
          recipientId: booking.menteeId,
          senderId: user.userId,
          type: 'MENTOR_BOOKING_CONFIRMED',
          title: 'Session Confirmed! ✅',
          body: `${booking.mentorProfile.user.name} confirmed your session on "${booking.subject}"`,
          linkUrl: '/vidya-setu/bookings',
          metadata: { bookingId },
        },
      });
      sendEmail.mentorBookingConfirmed(
        booking.mentee.name || booking.mentee.email,
        booking.mentorProfile.user.name || booking.mentorProfile.user.email,
        booking.subject,
        booking.mentee.email,
      ).catch(console.error);
    } else if (action === 'CANCEL') {
      if (!isMentor && !isMentee) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      await prisma.mentorBooking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
      const notifyId = isMentor ? booking.menteeId : booking.mentorUserId;
      await prisma.notification.create({
        data: {
          recipientId: notifyId,
          senderId: user.userId,
          type: 'MENTOR_BOOKING_CANCELLED',
          title: 'Session Cancelled',
          body: `Session on "${booking.subject}" has been cancelled.`,
          linkUrl: '/vidya-setu/bookings',
          metadata: { bookingId },
        },
      });
    } else if (action === 'SET_LINK') {
      if (!isMentor) return NextResponse.json({ success: false, message: 'Only the mentor can set a meeting link' }, { status: 403 });
      await prisma.mentorBooking.update({ where: { id: bookingId }, data: { meetingLink } });
    } else if (action === 'COMPLETE') {
      if (!isMentor) return NextResponse.json({ success: false, message: 'Only the mentor can mark as complete' }, { status: 403 });
      await prisma.$transaction([
        prisma.mentorBooking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } }),
        prisma.mentorProfile.update({ where: { id: booking.mentorProfileId }, data: { totalSessions: { increment: 1 } } }),
      ]);
    } else if (action === 'RATE') {
      if (!isMentee) return NextResponse.json({ success: false, message: 'Only the mentee can rate' }, { status: 403 });
      if (booking.status !== 'COMPLETED') return NextResponse.json({ success: false, message: 'Can only rate completed sessions' }, { status: 400 });
      if (!menteeRating) return NextResponse.json({ success: false, message: 'Rating required' }, { status: 400 });

      await prisma.mentorBooking.update({ where: { id: bookingId }, data: { menteeRating, menteeReview } });

      // Recalculate mentor average rating
      const allRatings = await prisma.mentorBooking.findMany({
        where: { mentorProfileId: booking.mentorProfileId, menteeRating: { not: null } },
        select: { menteeRating: true },
      });
      const avg = allRatings.reduce((s, r) => s + (r.menteeRating || 0), 0) / allRatings.length;
      await prisma.mentorProfile.update({
        where: { id: booking.mentorProfileId },
        data: { averageRating: Math.round(avg * 10) / 10, totalRatings: allRatings.length },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ success: false, message: error.errors[0]?.message }, { status: 400 });
    if (error?.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed to update booking' }, { status: 500 });
  }
}