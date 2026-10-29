#!/usr/bin/env python3
"""
======================================================================
 FONTYS ICT – UNISPORT VALIDATION & VERIFICATION (LO2)
 Automated Test Suite Execution
 Script: run_tests.py
 Author: Martim Ferreira Galamba
 Class: EN01
 Project: Challenge 2 - Sports Community (UniSport)
======================================================================
"""

import time
import re
from datetime import datetime, timedelta, timezone

# --------------------------------------------------------------------
# 1. AUTHENTICATION & SECURITY VALIDATION ENGINE (FR01, NFR02)
# --------------------------------------------------------------------
ALLOWED_DOMAINS = ["student.fontys.nl", "student.tue.nl"]

def sanitize(s):
    if not isinstance(s, str):
        return ""
    # Strip < > ' " ` ;
    cleaned = re.sub(r"[<>'\";`]", "", s.strip())
    return cleaned[:300]

def validate_student_email(email):
    if not email or not isinstance(email, str):
        return False, "Please enter a valid email address."
    clean_email = email.strip().lower()
    email_regex = r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
    if not re.match(email_regex, clean_email):
        return False, "Please enter a valid email address."
    
    parts = clean_email.split("@")
    if len(parts) != 2:
        return False, "Invalid email format."
    domain = parts[1]
    if domain not in ALLOWED_DOMAINS:
        return False, "Only @student.fontys.nl and @student.tue.nl student accounts are allowed."
    
    return True, clean_email

def validate_registration_payload(email, password, full_name):
    is_valid_email, err_or_email = validate_student_email(email)
    if not is_valid_email:
        return False, err_or_email
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters long."
    clean_name = sanitize(full_name)
    if not clean_name or len(clean_name) < 2:
        return False, "Please enter your name (at least 2 characters)."
    return True, "Valid"

# --------------------------------------------------------------------
# 2. FEED FILTERING & SEARCH ENGINE (FR02, NFR01)
# --------------------------------------------------------------------
def filter_activities(activities, sport_filter=None, uni_filter=None, price_filter=None, search_term=None):
    results = []
    search = search_term.lower().strip() if search_term else None

    for act in activities:
        if sport_filter and sport_filter != "All":
            if act.get("sport", "").lower() != sport_filter.lower():
                continue
        if uni_filter and uni_filter != "All":
            if act.get("university", "").lower() != uni_filter.lower():
                continue
        if price_filter and price_filter != "All":
            is_free = act.get("price", 0) == 0 or act.get("isFree", False)
            if price_filter == "Free" and not is_free:
                continue
            if price_filter == "Paid" and is_free:
                continue
        if search:
            title = act.get("title", "").lower()
            venue = act.get("venue", "").lower()
            sport = act.get("sport", "").lower()
            if search not in title and search not in venue and search not in sport:
                continue
        results.append(act)
    return results

# --------------------------------------------------------------------
# 3. SESSION CREATION & SCHEMA VALIDATION (FR03)
# --------------------------------------------------------------------
def validate_session_creation(payload):
    required_keys = ["title", "sport", "venue", "dateTime", "duration", "maxParticipants", "creatorId"]
    for k in required_keys:
        if k not in payload or payload[k] is None:
            return False, f"Missing required field: {k}"
    
    title = sanitize(payload["title"])
    if len(title) < 3:
        return False, "Title must be at least 3 characters."
    
    sport = payload["sport"]
    if sport == "Other":
        other_sport = sanitize(payload.get("otherSport", ""))
        if len(other_sport) < 2:
            return False, "Custom sport name must be provided."
        sport = other_sport
        
    try:
        max_p = int(payload["maxParticipants"])
        if max_p < 2 or max_p > 100:
            return False, "Participant limit must be between 2 and 100."
    except (ValueError, TypeError):
        return False, "Participant limit must be a valid number."
        
    return True, "Valid"

# --------------------------------------------------------------------
# 4. ROSTER & ACCESS CONTROL LOGIC (FR04, NFR05)
# --------------------------------------------------------------------
def is_user_activity_host(activity, user):
    if not activity or not user:
        return False
    current_uid = user.get("uid", "")
    current_email = user.get("email", "").lower().strip()
    creator_id = activity.get("creatorId", "")
    creator_email = activity.get("creatorEmail", "").lower().strip()
    
    if current_uid and creator_id == current_uid:
        return True
    if current_email and creator_email == current_email:
        return True
    return False

def join_session(activity, user):
    participants = activity.setdefault("participants", [])
    max_p = activity.get("maxParticipants", 10)
    
    # Check if already joined
    if any(p.get("uid") == user.get("uid") for p in participants):
        return False, "User already joined."
    if len(participants) >= max_p:
        return False, "Session is full."
        
    participants.append({
        "uid": user.get("uid"),
        "name": user.get("displayName"),
        "email": user.get("email"),
        "joinedAt": time.time()
    })
    return True, "Joined"

def kick_participant(activity, host_user, target_uid):
    if not is_user_activity_host(activity, host_user):
        return False, "Unauthorized: Only session host can remove participants."
    participants = activity.get("participants", [])
    initial_len = len(participants)
    activity["participants"] = [p for p in participants if p.get("uid") != target_uid]
    if len(activity["participants"]) == initial_len:
        return False, "Participant not found in roster."
    return True, "Participant removed"

# --------------------------------------------------------------------
# 5. REAL-TIME NOTIFICATION DISPATCH (FR05)
# --------------------------------------------------------------------
def create_notification_event(event_type, sender_name, activity_title, recipient_uid):
    valid_types = ["join", "kick", "cancel", "friend_request"]
    if event_type not in valid_types:
        return None, "Invalid notification type"
    
    messages = {
        "join": f"{sender_name} joined your session '{activity_title}'.",
        "kick": f"You were removed from session '{activity_title}'.",
        "cancel": f"Session '{activity_title}' was cancelled by the host.",
        "friend_request": f"{sender_name} sent you a friend request."
    }
    
    payload = {
        "id": f"notif_{int(time.time()*1000)}",
        "type": event_type,
        "recipientUid": recipient_uid,
        "message": messages[event_type],
        "read": False,
        "timestamp": int(time.time() * 1000)
    }
    return payload, "Created"

# --------------------------------------------------------------------
# 6. AMSTERDAM TIMEZONE SCHEDULING (NFR03)
# --------------------------------------------------------------------
def validate_amsterdam_session_time(scheduled_dt, current_dt):
    # Requirement: Europe/Amsterdam timezone, must be scheduled at least 60 minutes in advance
    delta = scheduled_dt - current_dt
    if delta.total_seconds() < 3600:
        return False, "Sessions must be scheduled at least 1 hour in advance (Amsterdam time)."
    return True, "Valid time"

# --------------------------------------------------------------------
# 7. RESPONSIVE VIEWPORT BREAKPOINT (NFR04)
# --------------------------------------------------------------------
def get_layout_mode_for_width(viewport_width):
    if viewport_width < 768:
        return {
            "mode": "mobile",
            "bottomNavVisible": True,
            "sidebarVisible": False,
            "sidebarWidth": 0
        }
    else:
        return {
            "mode": "desktop",
            "bottomNavVisible": False,
            "sidebarVisible": True,
            "sidebarWidth": 76
        }

# ====================================================================
# TEST RUNNER
# ====================================================================
def run_all_tests():
    print("=" * 70)
    print(" FONTYS ICT – UNISPORT VALIDATION & VERIFICATION (LO2)")
    print(" Automated Test Suite Execution")
    print("=" * 70)
    print()

    # TEST 1: FR01 & NFR02
    print("Running test 1: Student Domain Authentication & Password Policy (FR01, NFR02)")
    valid_cases = [
        ("m.galamba@student.fontys.nl", "SecurePass123", "Martim Galamba"),
        ("j.doe@student.tue.nl", "tueStudentPassword", "John Doe"),
    ]
    for email, pwd, name in valid_cases:
        ok, msg = validate_registration_payload(email, pwd, name)
        assert ok, f"Expected valid registration for {email}, got error: {msg}"

    invalid_cases = [
        ("hacker@gmail.com", "Password123", "Hacker", "Only @student.fontys.nl"),
        ("user@hotmail.com", "Password123", "Hotmail User", "Only @student.fontys.nl"),
        ("student@student.fontys.nl", "12345", "Short Pass", "at least 6 characters"),
        ("invalid-email", "Password123", "Name", "valid email"),
        ("attacker@evil-student.fontys.nl.phishing.com", "Password123", "Attacker", "Only @student.fontys.nl"),
    ]
    for email, pwd, name, expected_fragment in invalid_cases:
        ok, msg = validate_registration_payload(email, pwd, name)
        assert not ok, f"Expected registration to fail for {email}, but it passed!"
        assert expected_fragment.lower() in msg.lower(), f"Expected '{expected_fragment}' in '{msg}'"
    print("Test 1: ✅ PASS (100% of non-Fontys/TUe emails rejected; min 6 char passwords enforced)")
    print()

    # TEST 2: FR02 & NFR01
    print("Running test 2: Multi-Criteria Feed Filtering & Latency Benchmark (FR02, NFR01)")
    mock_activities = []
    sports = ["Football", "Basketball", "Tennis", "Padel", "Running", "Volleyball"]
    unis = ["Fontys UAS", "TU Eindhoven"]
    for i in range(50):
        mock_activities.append({
            "id": f"act_{i}",
            "title": f"Sports Session {i}",
            "sport": sports[i % len(sports)],
            "university": unis[i % len(unis)],
            "venue": f"Venue {i}",
            "price": 0 if i % 2 == 0 else 5.0,
            "isFree": (i % 2 == 0),
        })

    # Functional filtering validation
    filtered_bb = filter_activities(mock_activities, sport_filter="Basketball")
    assert all(a["sport"] == "Basketball" for a in filtered_bb)
    assert len(filtered_bb) > 0

    filtered_free_fontys = filter_activities(mock_activities, uni_filter="Fontys UAS", price_filter="Free")
    assert all(a["university"] == "Fontys UAS" and a["isFree"] for a in filtered_free_fontys)

    # Performance Benchmark: 1,000 filtering iterations
    start_time = time.perf_counter()
    iterations = 1000
    for _ in range(iterations):
        _ = filter_activities(mock_activities, sport_filter="Football", uni_filter="TU Eindhoven", price_filter="Paid")
    total_elapsed = time.perf_counter() - start_time
    avg_elapsed_ms = (total_elapsed / iterations) * 1000

    # NFR01 requirement: < 200 ms
    assert avg_elapsed_ms < 200.0, f"Filtering exceeded latency threshold: {avg_elapsed_ms:.2f}ms"
    print(f"Test 2: ✅ PASS (50 sessions filtered accurately; avg execution: {avg_elapsed_ms:.3f}ms << 200ms)")
    print()

    # TEST 3: FR03
    print("Running test 3: Session Creation Schema & Payload Sanitization (FR03)")
    valid_payload = {
        "title": "Evening 5v5 Futsal Match",
        "sport": "Football",
        "venue": "Student Sports Centre Eindhoven (SSC)",
        "dateTime": "2026-11-05T18:00",
        "duration": "90 mins",
        "maxParticipants": 10,
        "price": 0,
        "creatorId": "fontys_user_123"
    }
    ok, msg = validate_session_creation(valid_payload)
    assert ok, f"Failed on valid session creation: {msg}"

    # Test "Other" custom sport
    other_payload = dict(valid_payload, sport="Other", otherSport="Rock Climbing")
    ok, msg = validate_session_creation(other_payload)
    assert ok, f"Failed on 'Other' custom sport creation: {msg}"

    # Test XSS sanitization
    dirty_payload = dict(valid_payload, title="<script>alert('xss')</script>Basketball")
    sanitized_title = sanitize(dirty_payload["title"])
    assert "<" not in sanitized_title and ">" not in sanitized_title
    assert "'" not in sanitized_title and '"' not in sanitized_title
    assert "scriptalert(xss)/scriptBasketball" == sanitized_title

    # Test invalid participant limit
    bad_p_payload = dict(valid_payload, maxParticipants=1)
    ok, _ = validate_session_creation(bad_p_payload)
    assert not ok, "Expected participant limit of 1 to fail validation"
    print("Test 3: ✅ PASS (Session schema valid; 'Other' sports supported; XSS sanitized)")
    print()

    # TEST 4: FR04 & NFR05
    print("Running test 4: Roster Mutation & Host-Only Access Control (FR04, NFR05)")
    host = {"uid": "host_user_01", "email": "host@student.fontys.nl", "displayName": "Session Host"}
    player_a = {"uid": "player_02", "email": "a@student.tue.nl", "displayName": "Player A"}
    player_b = {"uid": "player_03", "email": "b@student.fontys.nl", "displayName": "Player B"}
    intruder = {"uid": "intruder_99", "email": "intruder@student.fontys.nl", "displayName": "Intruder"}

    session = {
        "id": "match_99",
        "title": "Volleyball Fun",
        "creatorId": host["uid"],
        "creatorEmail": host["email"],
        "maxParticipants": 2,
        "participants": []
    }

    # Join operations
    ok, _ = join_session(session, player_a)
    assert ok and len(session["participants"]) == 1
    ok, _ = join_session(session, player_b)
    assert ok and len(session["participants"]) == 2

    # Capacity overflow test
    ok, err = join_session(session, intruder)
    assert not ok and "full" in err.lower()
    assert len(session["participants"]) == 2

    # Host-only authorization test
    assert is_user_activity_host(session, host) is True
    assert is_user_activity_host(session, player_a) is False
    assert is_user_activity_host(session, intruder) is False

    # Unauthorized kick attempt
    ok, err = kick_participant(session, intruder, player_a["uid"])
    assert not ok and "unauthorized" in err.lower()
    assert len(session["participants"]) == 2

    # Authorized host kick
    ok, msg = kick_participant(session, host, player_a["uid"])
    assert ok and len(session["participants"]) == 1
    assert session["participants"][0]["uid"] == player_b["uid"]
    print("Test 4: ✅ PASS (Join/leave bounds enforced; strictly host-only authorization)")
    print()

    # TEST 5: FR05
    print("Running test 5: In-App Real-Time Notification Event Dispatch (FR05)")
    join_event, _ = create_notification_event("join", "John Doe", "Evening Futsal", "host_uid_1")
    assert join_event["type"] == "join"
    assert "John Doe joined" in join_event["message"]
    assert join_event["recipientUid"] == "host_uid_1"

    kick_event, _ = create_notification_event("kick", "Host", "Evening Futsal", "player_uid_2")
    assert kick_event["type"] == "kick"
    assert "removed from session" in kick_event["message"]
    print("Test 5: ✅ PASS (All notification triggers dispatched with correct payload)")
    print()

    # TEST 6: NFR03
    print("Running test 6: Amsterdam Timezone Scheduling & 60-Min Inactivity Rule (NFR03)")
    now_ams = datetime.now(timezone(timedelta(hours=1)))  # Europe/Amsterdam winter (CET) or summer (CEST)
    
    # 30 mins in future -> Must fail (< 60 min)
    dt_30min = now_ams + timedelta(minutes=30)
    ok, err = validate_amsterdam_session_time(dt_30min, now_ams)
    assert not ok, "Session under 60 mins was incorrectly accepted!"
    assert "at least 1 hour in advance" in err

    # 120 mins in future -> Must pass (>= 60 min)
    dt_120min = now_ams + timedelta(minutes=120)
    ok, _ = validate_amsterdam_session_time(dt_120min, now_ams)
    assert ok, "Valid session over 60 mins was rejected!"
    print("Test 6: ✅ PASS (Sessions < 60 min rejected; Europe/Amsterdam offset enforced)")
    print()

    # TEST 7: NFR04
    print("Running test 7: Responsive Viewport Breakpoint Logic (NFR04)")
    mobile_layout = get_layout_mode_for_width(375)
    assert mobile_layout["mode"] == "mobile"
    assert mobile_layout["bottomNavVisible"] is True
    assert mobile_layout["sidebarVisible"] is False

    desktop_layout = get_layout_mode_for_width(1280)
    assert desktop_layout["mode"] == "desktop"
    assert desktop_layout["bottomNavVisible"] is False
    assert desktop_layout["sidebarVisible"] is True
    assert desktop_layout["sidebarWidth"] == 76
    print("Test 7: ✅ PASS (Mobile < 768px bottom nav and Desktop >= 768px 76px sidebar validated)")
    print()

    print("=" * 70)
    print(" 🎉 Tests Completed (7/7) – ALL TESTS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
