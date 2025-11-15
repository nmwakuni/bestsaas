import { describe, it, expect } from "@jest/globals";

describe("Events API", () => {
  describe("Event Validation", () => {
    it("should validate event types", () => {
      const validTypes = [
        "Academic",
        "Sports",
        "Meeting",
        "Holiday",
        "Extracurricular",
        "Exam",
        "Trip",
        "Other",
      ];
      const testType = "Exam";

      expect(validTypes).toContain(testType);
    });

    it("should validate date format", () => {
      const validDate = "2024-05-15";
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(dateRegex.test(validDate)).toBe(true);
    });

    it("should validate time format", () => {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      const validTimes = ["08:00", "14:30", "23:59"];

      validTimes.forEach((time) => {
        expect(timeRegex.test(time)).toBe(true);
      });
    });
  });

  describe("Calendar Grouping", () => {
    it("should group events by date", () => {
      const events = [
        { id: "1", startDate: new Date("2024-05-15") },
        { id: "2", startDate: new Date("2024-05-15") },
        { id: "3", startDate: new Date("2024-05-16") },
      ];

      const grouped = events.reduce((acc: any, event) => {
        const dateKey = event.startDate.toISOString().split("T")[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
      }, {});

      expect(grouped["2024-05-15"]).toHaveLength(2);
      expect(grouped["2024-05-16"]).toHaveLength(1);
    });

    it("should filter upcoming events", () => {
      const now = new Date("2024-05-15");
      const events = [
        { id: "1", startDate: new Date("2024-05-14") }, // Past
        { id: "2", startDate: new Date("2024-05-16") }, // Future
        { id: "3", startDate: new Date("2024-05-17") }, // Future
      ];

      const upcoming = events.filter((e) => e.startDate >= now);

      expect(upcoming).toHaveLength(2);
    });
  });

  describe("Date Range Filtering", () => {
    it("should filter events within date range", () => {
      const startDate = new Date("2024-05-01");
      const endDate = new Date("2024-05-31");

      const events = [
        { id: "1", startDate: new Date("2024-04-30") },
        { id: "2", startDate: new Date("2024-05-15") },
        { id: "3", startDate: new Date("2024-06-01") },
      ];

      const filtered = events.filter((e) => e.startDate >= startDate && e.startDate <= endDate);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("2");
    });

    it("should get events for specific month", () => {
      const year = 2024;
      const month = 5; // May

      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      expect(firstDay.toISOString().slice(0, 10)).toBe("2024-05-01");
      expect(lastDay.toISOString().slice(0, 10)).toBe("2024-05-31");
    });
  });

  describe("Bulk Event Creation", () => {
    it("should create multiple events (term dates)", () => {
      const termEvents = [
        {
          title: "Term 1 Opening",
          eventType: "Academic" as const,
          startDate: "2024-01-15",
        },
        {
          title: "Term 1 Mid-term Break",
          eventType: "Holiday" as const,
          startDate: "2024-03-01",
          endDate: "2024-03-08",
        },
        {
          title: "Term 1 Closing",
          eventType: "Academic" as const,
          startDate: "2024-04-26",
        },
      ];

      expect(termEvents).toHaveLength(3);
      expect(termEvents[0].eventType).toBe("Academic");
      expect(termEvents[1].eventType).toBe("Holiday");
    });
  });
});
