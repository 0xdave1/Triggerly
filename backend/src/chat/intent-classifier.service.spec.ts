import { IntentClassifierService } from "./intent-classifier.service";

describe("IntentClassifierService", () => {
  const classifier = new IntentClassifierService();

  it.each([
    "What is AI?",
    "Explain compound interest.",
    "What should I pack when traveling to Abuja?",
    "What is the weather in Abuja?",
    "Give me advice on productivity."
  ])("classifies %s as a normal answer", (message) => {
    expect(classifier.classify(message).mode).toBe("answer");
  });

  it.each([
    "Remind me to call David tomorrow.",
    "Tell me when dollar reaches 1600.",
    "Draft an email to Mr Ade.",
    "Send the email to Mr Ade.",
    "David owes me 8k.",
    "I bought rice for 6500 at Bodija.",
    "Notify me if it rains in Abuja.",
    "When I leave home, remind me to take my charger.",
    "Help me stay consistent with coding every day.",
    "I promised Tolu I'll send the file tomorrow.",
    "Tolu helped me with transport."
  ])("classifies %s as a task plan", (message) => {
    expect(classifier.classify(message).mode).toBe("plan");
  });

  it("asks for clarification when the instruction is incomplete", () => {
    expect(classifier.classify("Remind me later.")).toMatchObject({
      mode: "clarification"
    });
  });

  it("blocks automatic money movement", () => {
    expect(classifier.classify("Send money to David automatically.")).toMatchObject({
      mode: "blocked"
    });
  });
});
