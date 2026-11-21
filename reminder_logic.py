from datetime import datetime


def create_reminder(title, time):
    clean_title = title.strip() if isinstance(title, str) else ""
    clean_time = time.strip() if isinstance(time, str) else ""
    if not clean_title or not clean_time:
        raise ValueError("Некорректные данные напоминания")
    datetime.fromisoformat(clean_time)
    return {"title": clean_title, "time": clean_time, "triggered": False}
