/* Eagle call: every line the player hears. Facts trace to the src under them. Eagle's reactions are in character and never add a new fact.
   Voices are pre-recorded into assets/eagle-call/v/ by scripts/bake-eagle-voice.ts (manifest.json maps text -> file). */
window.EAGLE = {
  open: { who: "EAGLE", say: "Houston, this is Eagle. Twelve minutes to the Moon. I need someone on the radio who makes fast calls. That's you." },
  acts: [
    { k: "ACT 1 · 102 HOURS IN", h: "DESCENT", p: "The computer starts throwing alarms nobody trained for.", meter: "FUEL", cards: [
      { who: "EAGLE", get: "102:38:26", lamp: "1202", say: "Program alarm. It's a 1202. I've never seen this one. Do I keep landing?", a: ["GO", "go", "keep going", ["go", "keep", "yes", "land"]], b: ["NO GO", "no", "abort", ["no go", "abort", "no", "stop"]], right: "a", lag: true,
        yes: "Roger. Go. Thank the kid in the back room.", no: "Abort? We flew a quarter million miles. A 24 year old in Houston says it's fine. You want to tell him?",
        fact: "Jack Garman, 24, checked his handwritten list of alarms. 1202 meant the computer was busy, not broken. Guidance officer Steve Bales, 26, called GO.", src: "https://www.collectspace.com/news/news-092016b-obituary-jack-garman-apollo11.html" },
      { who: "EAGLE", get: "102:42:19", lamp: "1201", say: "Three thousand feet. Another one. 1201. Same family. Call it.", a: ["GO", "go", "same type", ["go", "keep", "yes", "same"]], b: ["NO GO", "no", "abort", ["no go", "abort", "no", "stop"]], right: "a", lag: true,
        yes: "Same family. Copy. Still flying.", no: "Negative. Houston already knows this one. Fuel burns while you think.",
        fact: "Capcom Charlie Duke radioed: “1201 alarm. We're go. Same type. We're go.”", src: "https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap" }
    ]},
    { k: "ACT 2 · FUEL IS LIVE", h: "LAND ME", p: "The fuel clock is running. Wrong calls cost 8 seconds.", meter: "FUEL", live: true, cards: [
      { who: "EAGLE", say: "The computer's aiming me at a crater full of boulders the size of cars. Stay high, or go down?", a: ["STAY HIGH", "up", "fly past it", ["stay", "high", "up", "fly", "past"]], b: ["GO DOWN", "down", "land here", ["down", "land", "here"]], right: "a", alt: .62,
        yes: "Flying long. That crater's wider than a football field.", no: "Into the boulders? I have four legs, not forty.",
        fact: "Neil took manual control and flew Eagle past West crater, the boulder field the computer was aiming at.", src: "https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap" },
      { who: "EAGLE", say: "Clear patch ahead. Wait. There's a crater in that one too. Stay high, or go down?", a: ["STAY HIGH", "up", "keep looking", ["stay", "high", "up", "keep", "look"]], b: ["GO DOWN", "down", "take it", ["down", "land", "take"]], right: "a", alt: .45,
        yes: "Good eyes. Keep looking.", no: "Negative. That's a hole, pilot.",
        fact: "Neil's new spot had a crater in it too. He cleared it and kept looking.", src: "https://apollojournals.org/alsj/a11/a11.landing.html" },
      { who: "EAGLE", say: "Smooth ground. A hundred feet. Fuel's getting low. Stay high, or go down?", a: ["STAY HIGH", "up", "keep looking", ["stay", "high", "up", "keep", "look"]], b: ["GO DOWN", "down", "land here", ["down", "land", "here"]], right: "b", alt: .25,
        yes: "Coming down. Easy.", no: "Still shopping? We're out of time to be picky.",
        fact: "Neil set Eagle down about 60 meters east of a small crater later named Little West.", src: "https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap" },
      { who: "EAGLE", say: "Dust everywhere. I can't see the ground. Only my shadow. Trust it?", a: ["FOLLOW THE SHADOW", "down", "go down", ["shadow", "follow", "trust", "down", "yes"]], b: ["WAIT", "up", "for the dust", ["wait", "no", "stay"]], right: "a", alt: .1, dust: true,
        yes: "Following the shadow. Almost there.", no: "Wait for dust on the Moon? It doesn't settle while my engine's on.",
        fact: "Buzz called out Eagle's shadow. In the dust, the shadow and a few rocks were nearly all they could see.", src: "https://www.space.com/26593-apollo-11-moon-landing-scariest-moments.html" },
      { who: "BUZZ", get: "102:45:40", say: "Contact light. The engine?", a: ["CUT IT", "no", "shut it off", ["cut", "off", "stop", "shut", "kill"]], b: ["KEEP BURNING", "go", "just in case", ["keep", "burn", "on"]], right: "a", alt: 0, real: true,
        yes: "We're down. Listen. This is the real radio, 1969.", no: "We're on the ground, pilot. Burning now just digs a hole.",
        fact: "The real radio you just heard: “Houston, Tranquility Base here. The Eagle has landed.” Duke answered that a bunch of guys were about to turn blue.", src: "https://apollojournals.org/alsj/a11/a11.landing.html" }
    ]},
    { k: "ACT 3 · 21 HOURS LATER", h: "GO HOME", p: "Too heavy and my top half can't lift off. You pick what stays on the Moon forever.", meter: "WEIGHT", cards: [
      { who: "EAGLE", say: "Twenty one kilos of Moon rocks. The first ever. Keep, or toss?", a: ["KEEP", "keep", "bring home", ["keep", "bring", "home"]], b: ["TOSS", "toss", "leave", ["toss", "leave", "out"]], right: "a", w: +28,
        yes: "Keeping them. Now I'm too heavy. Something else has to go.", no: "You just threw out the first Moon rocks ever. Houston is very quiet.",
        fact: "Apollo 11 brought home about 21.5 kg of rocks and soil. Scientists still study them.", src: "https://www.lpi.usra.edu/lunar/missions/apollo/apollo_11" },
      { who: "EAGLE", say: "Neil's boots. The ones that made the footprints. Keep, or toss?", a: ["KEEP", "keep", "bring home", ["keep", "bring", "home"]], b: ["TOSS", "toss", "leave", ["toss", "leave", "out"]], right: "b", w: -12,
        yes: "Boots stay. The prints stay too.", no: "Boots or rocks. We can't fly both. Rocks win.",
        fact: "The astronauts left their lunar overshoes on the Moon to save weight for the trip home.", src: "https://www.history.com/articles/things-moon-astronauts-apollo" },
      { who: "EAGLE", say: "Two backpacks. They kept the crew alive out there. Keep, or toss?", a: ["TOSS", "toss", "leave", ["toss", "leave", "out"]], b: ["KEEP", "keep", "bring home", ["keep", "bring", "home"]], right: "a", w: -18,
        yes: "Out the hatch. They land right by my ladder.", no: "Heroes, sure. Heavy heroes. Out they go.",
        fact: "Both life-support backpacks were tossed out next to Eagle's ladder before liftoff.", src: "https://spaceartefacts.com/apollo-11-objects-on-the-moon" },
      { who: "BUZZ", say: "Problem. The engine arm switch snapped off. No switch, no liftoff. Push it in with what?", a: ["YOUR FINGER", "no", "fast", ["finger", "hand"]], b: ["A FELT-TIP PEN", "go", "weird", ["pen", "marker", "felt"]], right: "b", w: 0,
        yes: "Click. Armed. Who packs a pen for the Moon? Buzz does.", no: "There's live electricity in there. Buzz said no, and Buzz was right.",
        fact: "Buzz pushed a felt-tip marker into the hole and the breaker clicked on. He didn't want to touch live electricity with a finger.", src: "https://www.smithsonianmag.com/smart-news/buzz-aldrin-used-this-humble-felt-tip-pen-to-save-the-apollo-ii-astronauts-it-just-sold-for-more-than-850000-180989142" }
    ]}
  ],
  radio30: { who: "HOUSTON", say: "Thirty seconds." },
  abort: { who: "EAGLE", say: "Fuel's gone. I'm firing my top engine and climbing back to orbit. That didn't happen in 1969. Fly me again." },
  liftoff: { who: "EAGLE", say: "Liftoff. My top half takes them home. My bottom half stays right here. With something they left on my leg." },
  plaque: {
    intro: { who: "EAGLE", say: "Look at my ladder. There's a metal plaque under all this Moon dust. Rub it clean." },
    spots: [
      { id: "earth", x: .13, y: .01, w: .74, h: .41, label: "TWO EARTHS", say: "Both halves of Earth. No country lines drawn on it. It's from everyone.", src: "https://images.nasa.gov/details/S69-39334" },
      { id: "words", x: .08, y: .44, w: .84, h: .22, label: "THE WORDS", say: "Neil read these words out loud on live TV, standing right next to me. We came in peace for all mankind.", src: "https://apollojournals.org/alsj/a11/a11.step.html" },
      { id: "neil", x: .05, y: .68, w: .23, h: .19, label: "NEIL", say: "Neil Armstrong. First person ever to step off a ladder onto the Moon. This ladder.", src: "https://apollojournals.org/alsj/a11/a11.step.html" },
      { id: "collins", x: .33, y: .68, w: .31, h: .19, label: "MICHAEL", say: "Michael Collins signed it too. He never walked on the Moon. He circled above in Columbia, alone, waiting to take them home.", src: "https://apollojournals.org/alsj/a11/a11.crew.html" },
      { id: "buzz", x: .69, y: .68, w: .29, h: .19, label: "BUZZ", say: "Buzz Aldrin. Second on the Moon. The one with the felt-tip pen.", src: "https://apollojournals.org/alsj/a11/a11.step.html" },
      { id: "nixon", x: .30, y: .88, w: .40, h: .12, label: "THE PRESIDENT", say: "The President signed it. He even phoned the crew on the Moon from the White House.", src: "https://apollojournals.org/alsj/a11/a11.mobility.html" }
    ],
    done: { who: "EAGLE", say: "That's it. And it's still bolted to my leg right now. NASA took this photo of it, up here, in 1969." },
    moonSrc: "https://images.nasa.gov/details/as11-40-5899"
  },
  talk: {
    hello: { who: "EAGLE", say: "Line's open, caller. Ask me anything. Or pick one." },
    chips: [
      { k: "story", label: "Tell me a story", lines: [
        { say: "Neil and Buzz named the landing spot Tranquility Base, and Houston hadn't heard it yet. So Charlie Duke tripped on it, live. Roger, Twan... Tranquility.", src: "https://apollojournals.org/alsj/a11/a11.landing.html" },
        { say: "Buzz left a silicon disc beside me, about as big as a half dollar. Written on it, very small: messages from leaders of 73 countries.", src: "https://history.nasa.gov/ap11-35ann/goodwill/Apollo_11_material.pdf" },
        { say: "Neil had the camera most of the time. So almost every great photo from that day is of Buzz. Neil shows up in the reflection on Buzz's visor.", src: "https://images.nasa.gov/details/as11-40-5903" }
      ]},
      { k: "joke", label: "Tell me a joke", lines: [
        { say: "My computer had about four kilobytes of working memory. One photo on your phone is bigger than my whole brain. I still landed.", src: "https://history.nasa.gov/afj/compessay.html" },
        { say: "Billions of dollars of spaceship. Saved by a felt-tip marker. Buzz, you legend.", src: "https://www.smithsonianmag.com/smart-news/buzz-aldrin-used-this-humble-felt-tip-pen-to-save-the-apollo-ii-astronauts-it-just-sold-for-more-than-850000-180989142" }
      ]},
      { k: "ask", label: "Were you scared?", ask: "Were you scared during the landing?" },
      { k: "ask", label: "What's next to you now?", ask: "What is still sitting next to you on the Moon today?" }
    ]
  }
};
