/* Eagle, on the shared call frame. Every fact traces to its src. Reactions are in character and never add a fact.
   Voices: pre-recorded in assets/eagle-call/v (manifest.json maps "WHO|line" to a file). */
window.CALL = {
  id: "eagle", name: "EAGLE", what: "Apollo 11 lunar module", where: "Sea of Tranquility, Moon", year: "1969",
  meter: "FUEL", layers: "../../assets/layers/eagle/", voiceDir: "../../assets/eagle-call/v/", realAudio: "../../assets/audio/eagle.mp3",
  cut: "../../assets/img/eagle-cut.png",
  ring: "Incoming signal from the Moon. 1.3 second delay.",
  rules: "Make Eagle's calls. Match the 1969 crew. Three bad calls and the fuel's gone.",
  open: { who: "EAGLE", say: "Houston, this is Eagle. Twelve minutes to the Moon. I need someone on the radio who makes fast calls. That's you." },
  cards: [
    { who: "EAGLE", lamp: "1202", say: "Program alarm. It's a 1202. I've never seen this one. Do I keep landing?",
      a: { cap: "GO", keys: ["go", "keep", "yes", "land"] }, b: { cap: "NO GO", keys: ["no go", "abort", "no", "stop"] }, right: "a",
      yes: "Roger. Go. Thank the kid in the back room.", no: "Abort? We flew a quarter million miles. A 24 year old in Houston says it's fine. You want to tell him?",
      was: "1969: GO",
      fact: "Jack Garman, 24, had a handwritten list of alarms. 1202 meant busy, not broken.", src: "https://www.collectspace.com/news/news-092016b-obituary-jack-garman-apollo11.html" },
    { who: "EAGLE", fx: { lift: 1 }, say: "The computer's aiming me at a crater full of boulders the size of cars. Stay high, or go down?",
      a: { cap: "STAY HIGH", keys: ["stay", "high", "up", "fly", "past"] }, b: { cap: "GO DOWN", keys: ["down", "land", "here"] }, right: "a",
      yes: "Flying long. That crater's wider than a football field.", no: "Into the boulders? I have four legs, not forty.",
      was: "1969: STAY HIGH",
      fact: "Neil took manual control and flew past West crater's boulder field.", src: "https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap" },
    { who: "BUZZ", twist: "real", lamp: "CONTACT", warn: { who: "HOUSTON", say: "Thirty seconds." }, say: "Contact light. The engine?",
      a: { cap: "CUT IT", keys: ["cut", "off", "stop", "shut", "kill"] }, b: { cap: "KEEP BURNING", keys: ["keep", "burn", "on"] }, right: "a",
      yes: "We're down. Listen. This is the real radio, 1969.", no: "We're on the ground, pilot. Burning now just digs a hole.",
      was: "1969: CUT IT",
      real: { at: [24.6, 39.9], tag: "REAL RADIO · JULY 20 1969", line: "Houston, Tranquility Base here. The Eagle has landed." },
      fact: "About 17 seconds of fuel left when Eagle touched down.", src: "https://apollojournals.org/alsj/a11/a11.landing.html" }
  ],
  heart: { who: "EAGLE", say: "Last one, caller. Did they forget about me?",
    a: { cap: "THEY FORGOT", keys: ["forgot", "yes", "alone"] }, b: { cap: "THEY DIDN'T", keys: ["didn't", "no", "never"] },
    reveal: { who: "EAGLE", say: "Negative. My bottom half was the launch pad they lifted off from. I wasn't forgotten. I was the way home." },
    after: { who: "EAGLE", say: "Liftoff. My top half takes them home. My bottom half stays right here. With something they left on my leg." },
    src: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C" },
  keepsake: {
    title: "THE PLAQUE ON MY LEG", img: "../../assets/eagle-call/as11-40-5899.jpg",
    cap: "“We came in peace for all mankind.” Signed by Neil, Michael, Buzz.",
    line: { who: "EAGLE", say: "That's it. And it's still bolted to my leg right now. NASA took this photo of it, up here, in 1969." },
    src: "https://images.nasa.gov/details/as11-40-5899",
    today: { img: "../../assets/img/eagle-orbit.jpg", cap: "NASA's Lunar Reconnaissance Orbiter, 2012. That's me. The mirrors next to me still bounce lasers back to Earth.",
      line: { who: "EAGLE", say: "This is me. Right now. Photographed from orbit." },
      src: "https://lroc.im-ldi.com/images/563" }
  },
  miss2: { who: "EAGLE", say: "Two bad calls. One more and I'm out of fuel." },
  slow: { who: "EAGLE", say: "Caller? Talk to me. Fuel burns while you think." },
  abort: { who: "EAGLE", say: "Fuel's gone. I'm firing my top engine and climbing back to orbit. That didn't happen in 1969. Fly me again." },
  again: { who: "EAGLE", say: "Back again. Same Moon. Fly me better this time." },
  talk: [
    { label: "Tell me a story", who: "EAGLE", say: "Neil and Buzz named the landing spot Tranquility Base, and Houston hadn't heard it yet. So Charlie Duke tripped on it, live. Roger, Twan... Tranquility.", src: "https://apollojournals.org/alsj/a11/a11.landing.html" },
    { label: "Another story", who: "EAGLE", say: "Neil had the camera most of the time. So almost every great photo from that day is of Buzz. Neil shows up in the reflection on Buzz's visor.", src: "https://images.nasa.gov/details/as11-40-5903" },
    { label: "Tell me a joke", who: "EAGLE", say: "My computer had about four kilobytes of working memory. One photo on your phone is bigger than my whole brain. I still landed.", src: "https://history.nasa.gov/afj/compessay.html" }
  ],
  next: "../../index.html"
};
