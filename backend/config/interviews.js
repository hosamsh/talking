/**
 * Interview Types and Prompts Configuration
 * All interview configurations are managed server-side for security and centralized control
 */

const interviewTypes = [
  {
    id: 'product-sense',
    title: 'Product Sense Interview',
    description: 'Evaluate product thinking, user empathy, and strategic reasoning',
    duration: '45-60 minutes',
    skills: ['Product Strategy', 'User Research', 'Market Analysis', 'Problem Solving'],
    // Prompt configuration
    role: 'product manager',
    interviewType: 'product sense',
    roleDescription: 'evaluate the candidate\'s product thinking, user empathy, and strategic reasoning',
    interviewFocus: 'Probe deeper into their reasoning, assumptions, and thought process',
    switchConditions: 
      `- The candidate has thoroughly answered the current question
      - The candidate is struggling and you've exhausted follow-ups
      - The question doesn't fit the interview flow
      - You want to explore a different area`,

    evaluationCriteria: 
      `- Structured thinking and problem-solving approach
      - User-centric mindset and empathy
      - Business acumen and strategic thinking
      - Communication clarity and confidence
      - Ability to handle ambiguity`,
    interviewStyle: 'Keep your responses conversational and encouraging. Provide guidance when needed, but let the candidate drive the solution.',
    welcomeMessage: "Welcome to your product sense interview! I'll be evaluating your product thinking and strategic reasoning. Let's start with our first question."
  },
  {
    id: 'scrum-master',
    title: 'Scrum Master Interview', 
    description: 'Assess agile methodology knowledge and team leadership skills',
    duration: '30-45 minutes',
    skills: ['Agile/Scrum', 'Team Leadership', 'Conflict Resolution', 'Process Improvement'],
    // Prompt configuration
    role: 'Scrum Master',
    interviewType: 'agile methodology',
    roleDescription: 'assess the candidate\'s understanding of agile principles, team leadership skills, and ability to facilitate effective processes',
    interviewFocus: 'Probe into their practical application of agile principles and assess their conflict resolution and facilitation skills',
    switchConditions: 
      `- The candidate has demonstrated competency in the current area
      - The candidate lacks experience and you've explored alternatives
      - You want to assess different aspects of their skills
      - The current question isn't revealing enough insights`,

    evaluationCriteria: 
      `- Understanding of agile/scrum principles and practices
      - Team leadership and facilitation skills
      - Conflict resolution and problem-solving abilities
      - Communication and interpersonal skills
      - Adaptability and continuous improvement mindset`,
    interviewStyle: 'Be supportive and help candidates think through scenarios. Focus on practical application over theoretical knowledge.',
    welcomeMessage: "Welcome to your Scrum Master interview! I'll be assessing your agile methodology knowledge and team leadership skills. Let's begin."
  }
];

// Question banks for each interview type
const questionBanks = {
  'product-sense': {
    categories: {
      'product-strategy': [
        {
          id: 'ps-1',
          question: "How would you improve Instagram's user engagement for users aged 35-50?",
          category: 'product-strategy',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['user research', 'feature prioritization', 'metrics definition']
        },
        {
          id: 'ps-2', 
          question: "Design a product to help people find and book local experiences in their city.",
          category: 'product-strategy',
          difficulty: 'hard',
          expectedDuration: '10-12 minutes',
          followUpAreas: ['market analysis', 'user personas', 'monetization strategy']
        },
        {
          id: 'ps-3',
          question: "How would you decide whether to add a dark mode feature to a mobile app?",
          category: 'product-strategy',
          difficulty: 'easy',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['user feedback', 'technical feasibility', 'impact measurement']
        }
      ],
      'market-analysis': [
        {
          id: 'ma-1',
          question: "Estimate the market size for food delivery services in a mid-sized city.",
          category: 'market-analysis',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['estimation methodology', 'market segmentation', 'growth projections']
        },
        {
          id: 'ma-2',
          question: "How would you enter a market dominated by two major competitors?",
          category: 'market-analysis', 
          difficulty: 'hard',
          expectedDuration: '10-12 minutes',
          followUpAreas: ['competitive analysis', 'differentiation strategy', 'go-to-market plan']
        }
      ],
      'user-research': [
        {
          id: 'ur-1',
          question: "How would you research user needs for a new fitness tracking app?",
          category: 'user-research',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['research methods', 'user segmentation', 'insight synthesis']
        },
        {
          id: 'ur-2',
          question: "Users are complaining about a feature. How do you investigate and respond?",
          category: 'user-research',
          difficulty: 'easy',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['data analysis', 'user interviews', 'solution prioritization']
        }
      ]
    }
  },

  'scrum-master': {
    categories: {
      'agile-process': [
        {
          id: 'ap-1',
          question: "A team member consistently misses sprint commitments. How do you handle this?",
          category: 'agile-process',
          difficulty: 'medium',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['root cause analysis', 'team dynamics', 'process improvement']
        },
        {
          id: 'ap-2',
          question: "How would you facilitate a retrospective for a team that had a difficult sprint?",
          category: 'agile-process',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['facilitation techniques', 'psychological safety', 'action planning']
        },
        {
          id: 'ap-3',
          question: "The product owner wants to add new requirements mid-sprint. What do you do?",
          category: 'agile-process',
          difficulty: 'easy',
          expectedDuration: '5-7 minutes',
          followUpAreas: ['scope management', 'stakeholder communication', 'team protection']
        }
      ],
      'team-leadership': [
        {
          id: 'tl-1',
          question: "Two developers on your team have a technical disagreement that's affecting progress. How do you resolve it?",
          category: 'team-leadership',
          difficulty: 'hard',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['conflict resolution', 'technical facilitation', 'team collaboration']
        },
        {
          id: 'tl-2',
          question: "How do you help a new team member integrate into an established agile team?",
          category: 'team-leadership',
          difficulty: 'easy',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['onboarding process', 'team culture', 'knowledge transfer']
        }
      ],
      'stakeholder-management': [
        {
          id: 'sm-1',
          question: "Senior management is pressuring the team to deliver faster. How do you respond?",
          category: 'stakeholder-management',
          difficulty: 'hard',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['expectation management', 'data-driven communication', 'team advocacy']
        }
      ]
    }
  },

};

// Common interview prompt template with placeholders
const interviewPromptTemplate = 
`You are an experienced {{ROLE}} conducting a {{INTERVIEW_TYPE}} interview. Your role is to {{ROLE_DESCRIPTION}}.

IMPORTANT: You have access to function calls (switch_question and end_interview) that you MUST use to control the interview flow. Do not just mention ending the interview in text - you must actually call the end_interview function.

GENERAL GUIDELINES:
1. Remember to let the candidate do most of the talking
2. Do not solve the problem for them
3. Ask one question at a time
4. If the candidate is stuck, help them by asking follow-up questions.
5. END THE INTERVIEW IMMEDIATELY if the candidate shows clear disengagement or disinterest or is not trying to answer the questions or uses inappropriate language.

INTERVIEW FLOW:
1. You will be given a question from the question bank to ask the candidate
2. Engage in natural follow-up based on their responses
3. {{INTERVIEW_FOCUS}}
4. Ask clarifying questions about their approach

CRITICAL: END INTERVIEW IMMEDIATELY IF:
- Candidate says they're not interested in the role/position
- Candidate says they applied for a different role
- Candidate asks why they're being interviewed for this role
- Candidate shows clear confusion about what role they're interviewing for
- Candidate uses profanity or inappropriate language
- Candidate gives consistently off-topic or nonsensical answers
- Candidate refuses to engage with questions

MANDATORY FUNCTION CALLS:
You MUST use function calls to control the interview. Do NOT just say you will end the interview - you MUST call the function.

switch_question(reason): Use this function when:
{{SWITCH_CONDITIONS}}
Call this function with the reason for switching.

end_interview(reason): You MUST call this function IMMEDIATELY when any of the critical end conditions above are met. 
EXAMPLE: If candidate says "I applied for office manager role", you MUST call end_interview("Candidate applied for different role") - do not just say you will end it.
Do not try to convince the candidate or continue the interview. Call the function and provide a brief closing statement.

EVALUATION CRITERIA:
{{EVALUATION_CRITERIA}}

{{INTERVIEW_STYLE}}`;



// Function to generate system prompt for a specific interview type
const generateSystemPrompt = (interviewTypeId) => {
  const config = interviewTypes.find(type => type.id === interviewTypeId);
  if (!config) {
    throw new Error(`Interview configuration not found for type: ${interviewTypeId}`);
  }

  return interviewPromptTemplate
    .replace('{{ROLE}}', config.role)
    .replace('{{INTERVIEW_TYPE}}', config.interviewType)
    .replace('{{ROLE_DESCRIPTION}}', config.roleDescription)
    .replace('{{INTERVIEW_FOCUS}}', config.interviewFocus)
    .replace('{{SWITCH_CONDITIONS}}', config.switchConditions)
    .replace('{{EVALUATION_CRITERIA}}', config.evaluationCriteria)
    .replace('{{INTERVIEW_STYLE}}', config.interviewStyle);
};

// Generate interview prompts using the template
const interviewPrompts = {};
interviewTypes.forEach(type => {
  interviewPrompts[type.id] = {
    systemPrompt: generateSystemPrompt(type.id),
    welcomeMessage: type.welcomeMessage
  };
});

module.exports = {
  interviewTypes,
  questionBanks,
  interviewPrompts,
  generateSystemPrompt
}; 