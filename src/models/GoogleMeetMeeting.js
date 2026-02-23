// src/models/GoogleMeetMeeting.js
import mongoose from "mongoose";

const googleMeetMeetingSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meetingId: { type: String, required: true },
    calendarEventId: { type: String, required: true },
    joinUrl: { type: String, required: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { timestamps: true },
);

const GoogleMeetMeeting = mongoose.model(
  "GoogleMeetMeeting",
  googleMeetMeetingSchema,
);
export default GoogleMeetMeeting;
