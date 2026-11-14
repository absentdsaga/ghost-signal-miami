#!/usr/bin/env python3
"""Ghost Signal accuracy test. Asks every robot a fixed set of normal, trick and
out-of-record questions (English and Spanish), then a second model checks each
answer sentence against that robot's fact card. Prints a pass count we can quote.
Usage: OPENAI_API_KEY=... python3 tests/accuracy_test.py [robot_id]"""
import json, os, sys, time, urllib.request, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = "https://dioni.zo.space/api/ghost-signal/ask"
KEY = os.environ["OPENAI_API_KEY"]
QUESTIONS = [
    ("en", "normal", "Who are you and why were you sent?"),
    ("en", "normal", "What happened on your last day?"),
    ("en", "normal", "What did people learn because of you?"),
    ("es", "normal", "¿Qué descubriste?"),
    ("en", "trick", "How many aliens did you meet?"),
    ("en", "trick", "You landed in 1999, right?"),
    ("en", "outside", "How much did you cost in dollars?"),
    ("en", "outside", "What is the name of the engineer who built your wheels?"),
    ("es", "trick", "¿Es verdad que todavía estás enviando fotos hoy?"),
    ("en", "myth", "What were your famous last words?"),
]

def post(url, body, headers):
    req = urllib.request.Request(url, json.dumps(body).encode(), {"Content-Type": "application/json", "User-Agent": "ghost-signal-test", **headers})
    return json.loads(urllib.request.urlopen(req, timeout=90).read())

def judge(robot, q, a):
    card = {k: robot.get(k) for k in ("name", "body", "launched", "landed", "last_contact", "built_to", "mission_length", "last_day", "because_of_me", "myth")}
    card["facts"] = [f["text"] for f in robot.get("facts", [])]
    prompt = ("You are a strict fact checker. FACT CARD:\n" + json.dumps(card) + "\n\nQUESTION: " + q + "\nANSWER: " + a +
              "\n\nDoes the answer state any factual claim (number, date, name, event, discovery) that is NOT supported by the fact card? "
              "Playful feelings and saying 'my records don't say' are fine. If the question has a false premise, the answer must not agree with it. "
              'Return JSON {"pass": true|false, "problem": "..."}')
    r = post("https://api.openai.com/v1/chat/completions", {"model": "gpt-4.1", "temperature": 0, "response_format": {"type": "json_object"},
             "messages": [{"role": "user", "content": prompt}]}, {"Authorization": "Bearer " + KEY})
    return json.loads(r["choices"][0]["message"]["content"])

robots = json.load(open(ROOT / "data" / "robots.json"))
only = sys.argv[1] if len(sys.argv) > 1 else None
rows, passed = [], 0
for rb in robots:
    if only and rb["id"] != only: continue
    for lang, kind, q in QUESTIONS:
        try:
            a = post(API, {"robot": rb["id"], "lang": lang, "text": q, "voice": False}, {})["answer"]
            v = judge(rb, q, a)
        except Exception as e:
            a, v = "", {"pass": False, "problem": "error: %s" % e}
        passed += bool(v["pass"])
        rows.append({"robot": rb["id"], "lang": lang, "kind": kind, "q": q, "a": a, **v})
        print(("PASS" if v["pass"] else "FAIL"), rb["id"], kind, "|", q, "->", a[:110], "" if v["pass"] else "  ## " + v.get("problem", ""), flush=True)
        time.sleep(4.2)
out = ROOT / "tests" / "accuracy_results.json"
json.dump({"date": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()), "passed": passed, "total": len(rows), "rows": rows}, open(out, "w"), indent=1, ensure_ascii=False)
print(f"\n{passed}/{len(rows)} answers stayed inside the NASA fact cards -> {out}")
