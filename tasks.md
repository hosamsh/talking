tools:
LLM instruct to wait for a few minutes or until there's a readines signal
Interrupt silence
interrup the LLM
interrupt the user

send current time with each message.

Key prompt engineering techniques and patterns include:

- sned note that the text is autogenerted from tts, so it might include texual fetures (I'll add SSML). and the LLM might say i didn;t hear you well if the answer doens't make sense.

- keep track of conversation state... currently the user is thinking, user is answering, LLM is asking, etc. - “If the candidate hasn’t spoken for a while (or says ‘I’m thinking’), you can say something encouraging or use a brief interjection.” 
 “Interviewer: [cuts in] Sorry to interrupt, but one question on that...”

- Role Instruction: Clearly instruct the LLM to act as an interviewer with a specific tone (e.g. professional, encouraging) and knowledge of product management concepts. This ensures consistent persona and prevents the model from drifting out of character.

- Scenario Injection: Dynamically insert the chosen interview scenario or question into the prompt (more on the topic library below). For instance: “Your first question: <INSERT_SCENARIO_QUESTION>”. This gives the model context to start the interview.

- Few-Shot Example (if needed): To guide the model’s conversational style, you can include a brief example dialogue. For example, a snippet of an interviewer asking a question and a candidate responding, followed by the interviewer probing deeper. Few-shot prompting with high-quality examples of interview exchanges can improve realism . Ensure the examples reflect the desired behaviors (clarifying questions, hints, etc.).

- In-Context Guidelines: Embed important interviewing tactics in the prompt. For instance, “Remember to let the candidate do most of the talking. Do not solve the problem for them. Ask one question at a time.” These act as gentle rules the LLM will follow throughout the session.

- Hidden Rubric Cues: You can list key points the interviewer should look for (e.g. “Checklist: user needs identified, business goal mentioned, multiple solutions considered, trade-offs discussed”). Instruct the LLM to use these as a private guide for questioning. “If the candidate hasn’t addressed one of these areas, ask a follow-up on it.” This way, the model dynamically covers all evaluation criteria without explicitly stating them.


##Make all these as tools:
- Active Listening & Interjections: Program the interviewer to use back-channel signals such as “Mm-hmm,” “I see,” “Right,” at appropriate moments. Short interjections can be inserted while the candidate is speaking (or as a quick response) to show the interviewer is engaged. In a voice app, even a brief “Hmm…” or “Got it.” with the right intonation can simulate a human interviewer’s presence. These should be used sparingly and naturally, so the conversation doesn’t feel robotic.

- Clarification Questions: If the candidate’s answer is vague or assumes something unstated, the LLM should interject with clarifying queries. For example, “Just to clarify, which user segment are you focusing on?” or “When you say increase retention, are you targeting new users or existing users?” Such questions mirror what a real interviewer would ask to ensure understanding, and they push the candidate to be specific.

- Probing and Follow-ups: The LLM interviewer should probe deeper on key points. If a candidate provides a high-level solution, the interviewer might ask, “What leads you to believe that’s the right solution for the user’s problem?” or “Can you walk me through how that feature would work?”. Probing questions encourage the candidate to demonstrate depth of thought. Notably, the Khanmigo tutoring AI showed effectiveness by asking probing questions and prompting critical thinking during dialog
linkedin.com
 – similar tactics can be applied here to elicit a candidate’s reasoning.

-  Redirection (Keeping on Track): Candidates may sometimes go off on tangents or get lost in details. The simulated interviewer should gracefully steer the conversation back. For instance, “Those are interesting points about implementation; however, let’s refocus on the user needs for now. What primary user problem are we solving?”. This ensures important topics (like the core problem or goal) are fully addressed before time is wasted on side issues.

- Pausing and Silence: In human conversations, silence can be a tool. Configure the voice output to include short pauses, giving the feel of an interviewer taking a moment to think or letting the candidate ponder. For example, after a complex answer, the LLM might pause (via a brief silence or an “...” in text) and then say, “Okay, let’s unpack that a bit.” In a voice UI, you might implement this by inserting an SSML <break time="1s"/> tag in the TTS response to create a pause. This creates a natural rhythm rather than a constant rapid-fire exchange.

- Adaptive Hinting: If a candidate is completely stuck or asks for guidance, the LLM can provide a small nudge – much like a real interviewer might rephrase the question or highlight a consideration. For example, “Take your time. Think about why users might need this feature.” or “Consider how this fits with the company’s goals.” This should be done cautiously to avoid giving away answers, but it helps simulate an interviewer who wants the candidate to succeed and is managing the interview flow.




 Assessment criteria:
- Define Criteria:
    - Depth of Analysis: Did the candidate dive into root causes and thoughtful reasoning, or stay superficial?
    - Structural Thinking: Did they use a clear framework or logical structure to tackle the problem (e.g. identify users → problems → solutions → trade-offs)?
    - Prioritization: Did they identify which problem or solution matters most and explain why? Were they able to focus on the most impactful idea instead of trying to do everything?
    - Creativity and Insight: Did they propose innovative, out-of-the-box solutions or unique insights beyond obvious answers?
    - User Empathy & Business Sense: (Optional) How well did they balance user needs with business goals? This could be a combined metric or evaluated qualitatively.
- LLM as an Evaluator: a separate LLM?
    - Now as an evaluator, review the candidate’s performance. Rate 1-5 and give feedback on: (a) Depth of analysis, (b) Structure, (c) Prioritization, (d) Creativity. Use examples from their answers to justify.
    - LLMs are effective evaluators. In fact, frameworks like Prometheus have used an LLM with a scoring rubric and a candidate’s answer as input, outputting both scores and explanatory feedback
    - The LLM should be instructed to be fair and objective.

- Realtime feedback: 
    - one could have the interviewer LLM itself keep an internal score as the interview progresses (using a hidden chain-of-thought), but this is complex and not necessary for a first implementation. 

- Calibration and Fairness: If possible, test the evaluation on some sample “good” and “bad” answers to ensure the LLM isn’t overly harsh or lenient.


## questions banks
- Topic vareity: compile many.. and stoe in structured db
{
  "id": 101,
  "category": "Social Media",
  "question": "Your product is a photo-sharing app facing declining user engagement. What product changes would you explore to increase engagement?",
  "context": "The app has 1M daily users, mostly age 18-25, and strong competition from TikTok.",
  "rubric": {
    "key_points": ["Identifies reasons for decline (competition, user behavior changes)", "Targets specific user segment needs", "Proposes multiple features (e.g. short videos, messaging) and evaluates them", "Considers metrics for engagement"]
  }
}

- dynamic selection

- dynamic follow-up content: 
prepare some boilerplate follow-up info for certain scenarios. For example, if the candidate asks for data (“Do we know why engagement is declining?”), you could have the LLM or system provide a pre-defined snippet of data from the context (like “Our analytics show users post 20% less content than last year and session length is down by 15%”). This kind of dynamic injection of scenario details on-the-fly can make the simulation richer and more realistic. Such info can either be given to the LLM interviewer (to relay to the candidate when asked) or the system can directly provide it as a separate message.



## Studies
 one study merged an LLM with a tutoring system’s logic to give caregivers advice on homework help; it found that few-shot prompting combined with real-time context led to better guidance from the LLM

 In a simulation, explicitly assigning the “interviewer persona” to the LLM and even naming them (e.g. Interviewer: Alex (PM at Acme Corp)) can help anchor its responses

 Studies have also used multiple LLM agents to simulate user interviews in design, finding that LLM-generated agents can represent diverse user needs and surface latent requirements

 an interviewer agent could also emulate various interviewer styles (empathetic vs. challenging, etc.), though to start, a consistent style is easier to manage


 pressing candidate to elaborate: In tutoring scenarios, asking the student to explain further or justify answers leads to deeper learning. Khan Academy’s Khanmigo AI tutor, for instance, excels at tailored scaffolding – asking probing questions and giving hints to guide the learner

Several papers (and practical tools) on LLM-based evaluation note that explicitly instructing the model with a scoring rubric and requiring justification improves the alignment of AI evaluation with human judgment

techniques like having the LLM generate a “chain-of-thought” (an intermediate reasoning step) before giving a final score can make the grading more reliable - e.g. use a reasoning model..

 ## challenges
 Quality and Guardrails: A caution from these studies: LLMs, while powerful, can sometimes produce incorrect or nonsensical content if not properly guided. Khanmigo’s experience showed that answers can be flawed without additional guardrails or reasoning steps
linkedin.com
-  In our context, factual correctness is less of an issue than in math tutoring, but the interviewer LLM could still hallucinate product facts or accept weak answers too easily. Mitigation strategies include:
- Providing the LLM with any factual context available (so it doesn’t invent product data).
- Using a high-quality model (GPT-4) for the interviewer to reduce logical errors.
- Including instructions like “If the candidate’s idea is technically infeasible or already exists, challenge them on it politely.” (to avoid the AI agreeing with incorrect assertions).
- Possibly employing a reasoning chain: e.g., instruct the LLM to internally list what an ideal answer would cover before it starts asking questions, to have a target in mind.


## Tips
TTS UX tip: keep sentences reasonably short and insert pauses where a human would (using SSML <break> tags as needed). 

At the beginning of a long question, a short pause or preamble like “Alright,” can make it sound more conversational.


Latency and Turn-Taking:Long delays in voice interactions can be awkward. Strive for low latency between user speech and AI response. Techniques like streaming partial results can help – for example, start the TTS voice as soon as the first part of the LLM’s answer is ready, rather than waiting for the entire answer. Modern implementations (e.g. QuiLLMan voice chatbot) use bidirectional websocket streaming and audio compression to achieve near-instantaneous response, closely matching human conversational cadence. This level of real-time interaction greatly improves the experience. If full streaming is complex, at least try to keep the LLM’s responses concise so processing and TTS conversion are quick. 


-> if the user starts talking over the AI (perhaps to ask a clarification), the system should detect that (end TTS playback and listen).

Scoring/Feedback Presentation


Privacy and Recording: Since this is an interview practice tool, users might appreciate the ability to save their session or review their answers. Consider letting them replay the audio of their answers or read the transcript afterward. However, also respect privacy – clarify if any data is being saved on the server. Ideally, do processing locally or anonymize data if possible, especially because voice data can be sensitive.

Multimodal Enhancements: You could integrate visuals when appropriate – e.g., if the scenario involves a UI design, the interviewer might “share” a simple mockup image. This goes beyond basic requirements, but it’s a possibility. At minimum, ensure the app is responsive (mobile-friendly), as many users might want to practice by speaking into their phone.

