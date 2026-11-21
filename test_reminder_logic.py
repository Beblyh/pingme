import unittest
from reminder_logic import create_reminder


class TestCreateReminder(unittest.TestCase):
    def test_standard_reminder(self):
        self.assertEqual(
            create_reminder("  Сдать отчёт  ", "2026-05-01T12:00"),
            {"title": "Сдать отчёт", "time": "2026-05-01T12:00", "triggered": False},
        )

    def test_boundary_min_title(self):
        result = create_reminder("А", "2026-01-01T00:00")
        self.assertEqual(result["title"], "А")

    def test_invalid_inputs(self):
        with self.assertRaises(ValueError):
            create_reminder("   ", "2026-05-01T12:00")
        with self.assertRaises(ValueError):
            create_reminder("Позвонить", "   ")
        with self.assertRaises(ValueError):
            create_reminder("Позвонить", "not-a-date")


if __name__ == "__main__":
    unittest.main()
