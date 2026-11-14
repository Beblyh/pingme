def create_reminder(title, time):
    clean_title = title.strip() if isinstance(title, str) else ""
    if not clean_title or not time:
        raise ValueError("Некорректные данные напоминания")
    return {"title": clean_title, "time": time, "triggered": False}
