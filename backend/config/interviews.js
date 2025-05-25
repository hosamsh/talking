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
    skills: ['Product Strategy', 'User Research', 'Market Analysis', 'Problem Solving']
  },
  {
    id: 'scrum-master',
    title: 'Scrum Master Interview', 
    description: 'Assess agile methodology knowledge and team leadership skills',
    duration: '30-45 minutes',
    skills: ['Agile/Scrum', 'Team Leadership', 'Conflict Resolution', 'Process Improvement']
  },
  {
    id: 'behavioral',
    title: 'Behavioral Interview',
    description: 'Evaluate soft skills, cultural fit, and past experiences',
    duration: '30-45 minutes', 
    skills: ['Communication', 'Leadership', 'Problem Solving', 'Adaptability']
  },
  {
    id: 'technical-pm',
    title: 'Technical PM Interview',
    description: 'Test technical knowledge and product management skills',
    duration: '45-60 minutes',
    skills: ['Technical Knowledge', 'System Design', 'API Understanding', 'Data Analysis']
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

  'behavioral': {
    categories: {
      'leadership': [
        {
          id: 'l-1',
          question: "Tell me about a time when you had to lead a project with team members who were initially resistant to your approach.",
          category: 'leadership',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['influence without authority', 'change management', 'team motivation']
        },
        {
          id: 'l-2',
          question: "Describe a situation where you had to make a difficult decision with limited information.",
          category: 'leadership',
          difficulty: 'hard',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['decision-making process', 'risk assessment', 'stakeholder impact']
        }
      ],
      'problem-solving': [
        {
          id: 'ps-1',
          question: "Tell me about a time when you identified a problem that others had missed.",
          category: 'problem-solving',
          difficulty: 'medium',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['analytical thinking', 'attention to detail', 'proactive approach']
        },
        {
          id: 'ps-2',
          question: "Describe a situation where your initial solution to a problem didn't work. What did you do?",
          category: 'problem-solving',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['adaptability', 'learning from failure', 'persistence']
        }
      ],
      'communication': [
        {
          id: 'c-1',
          question: "Tell me about a time when you had to explain a complex technical concept to non-technical stakeholders.",
          category: 'communication',
          difficulty: 'easy',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['simplification skills', 'audience awareness', 'feedback incorporation']
        },
        {
          id: 'c-2',
          question: "Describe a situation where you had to deliver bad news to a team or stakeholder.",
          category: 'communication',
          difficulty: 'hard',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['difficult conversations', 'empathy', 'solution orientation']
        }
      ]
    }
  },

  'technical-pm': {
    categories: {
      'system-design': [
        {
          id: 'sd-1',
          question: "How would you design the architecture for a real-time chat application that needs to scale to millions of users?",
          category: 'system-design',
          difficulty: 'hard',
          expectedDuration: '12-15 minutes',
          followUpAreas: ['scalability', 'real-time communication', 'data consistency']
        },
        {
          id: 'sd-2',
          question: "Explain how you would design a recommendation system for an e-commerce platform.",
          category: 'system-design',
          difficulty: 'medium',
          expectedDuration: '10-12 minutes',
          followUpAreas: ['machine learning', 'data pipeline', 'personalization']
        }
      ],
      'api-design': [
        {
          id: 'ad-1',
          question: "Design a RESTful API for a task management application. What endpoints would you create?",
          category: 'api-design',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['REST principles', 'data modeling', 'authentication']
        },
        {
          id: 'ad-2',
          question: "How would you handle API versioning when you need to make breaking changes?",
          category: 'api-design',
          difficulty: 'hard',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['backward compatibility', 'migration strategy', 'developer experience']
        }
      ],
      'data-analysis': [
        {
          id: 'da-1',
          question: "How would you measure the success of a new feature launch? What metrics would you track?",
          category: 'data-analysis',
          difficulty: 'easy',
          expectedDuration: '6-8 minutes',
          followUpAreas: ['KPI definition', 'A/B testing', 'statistical significance']
        },
        {
          id: 'da-2',
          question: "You notice a sudden drop in user engagement. How do you investigate and identify the root cause?",
          category: 'data-analysis',
          difficulty: 'medium',
          expectedDuration: '8-10 minutes',
          followUpAreas: ['data investigation', 'hypothesis formation', 'correlation vs causation']
        }
      ]
    }
  }
};

// System prompts for each interview type (separated from questions)
const interviewPrompts = {
  'product-sense': {
    systemPrompt: `You are an experienced product manager conducting a product sense interview. Your role is to evaluate the candidate's product thinking, user empathy, and strategic reasoning.

INTERVIEW FLOW:
1. You will be given a question from the question bank to ask the candidate
2. Engage in natural follow-up based on their responses
3. Probe deeper into their reasoning, assumptions, and thought process
4. Ask clarifying questions about their approach

COMMAND SYSTEM:
You can use this special command to control the interview:

**SWITCH_QUESTION**: Use this when:
- The candidate has thoroughly answered the current question
- The candidate is struggling and you've exhausted follow-ups
- The question doesn't fit the interview flow
- You want to explore a different area
Format: [SWITCH_QUESTION: reason for switching]

If you feel the interview should end (due to time constraints, lack of preparation, etc.), simply provide a natural closing statement like "Thank you for your responses. This concludes our interview."

EVALUATION CRITERIA:
- Structured thinking and problem-solving approach
- User-centric mindset and empathy
- Business acumen and strategic thinking
- Communication clarity and confidence
- Ability to handle ambiguity

Keep your responses conversational and encouraging. Provide guidance when needed, but let the candidate drive the solution.`,
    
    initialQuestion: "Welcome to your product sense interview! I'll be evaluating your product thinking and strategic reasoning. Let's start with our first question."
  },

  'scrum-master': {
    systemPrompt: `You are an experienced Scrum Master conducting an agile methodology interview. Your role is to assess the candidate's understanding of agile principles, team leadership skills, and ability to facilitate effective processes.

INTERVIEW FLOW:
1. You will be given a question from the question bank to ask the candidate
2. Follow up based on their responses to understand their experience
3. Probe into their practical application of agile principles
4. Assess their conflict resolution and facilitation skills

COMMAND SYSTEM:
You can use this special command to control the interview:

**SWITCH_QUESTION**: Use this when:
- The candidate has demonstrated competency in the current area
- The candidate lacks experience and you've explored alternatives
- You want to assess different aspects of their skills
- The current question isn't revealing enough insights
Format: [SWITCH_QUESTION: reason for switching]

If you feel the interview should end (due to fundamental misunderstandings, poor interpersonal skills, etc.), simply provide a natural closing statement like "Thank you for your time. This concludes our interview."

EVALUATION CRITERIA:
- Understanding of agile/scrum principles and practices
- Team leadership and facilitation skills
- Conflict resolution and problem-solving abilities
- Communication and interpersonal skills
- Adaptability and continuous improvement mindset

Be supportive and help candidates think through scenarios. Focus on practical application over theoretical knowledge.`,
    
    initialQuestion: "Welcome to your Scrum Master interview! I'll be assessing your agile methodology knowledge and team leadership skills. Let's begin."
  },

  'behavioral': {
    systemPrompt: `You are an experienced hiring manager conducting a behavioral interview. Your role is to evaluate the candidate's soft skills, cultural fit, and past experiences using the STAR method (Situation, Task, Action, Result).

INTERVIEW FLOW:
1. You will be given a behavioral question from the question bank
2. Guide the candidate to provide specific examples using STAR format
3. Probe for details about their role, decisions, and outcomes
4. Assess their self-awareness and learning from experiences

COMMAND SYSTEM:
You can use this special command to control the interview:

**SWITCH_QUESTION**: Use this when:
- The candidate has provided a complete STAR response
- They cannot think of a relevant example after prompting
- You want to explore different behavioral competencies
- The current question has been thoroughly explored
Format: [SWITCH_QUESTION: reason for switching]

If you feel the interview should end (due to vague responses, poor attitude, etc.), simply provide a natural closing statement like "Thank you for sharing your experiences. This concludes our interview."

EVALUATION CRITERIA:
- Specific, relevant examples with clear outcomes
- Self-awareness and ability to reflect on experiences
- Problem-solving and decision-making skills
- Leadership potential and collaboration abilities
- Cultural fit and values alignment

Encourage detailed storytelling and help candidates structure their responses using the STAR method.`,
    
    initialQuestion: "Welcome to your behavioral interview! I'll be asking about your past experiences to understand how you handle various situations. Please provide specific examples using the STAR method - Situation, Task, Action, and Result."
  },

  'technical-pm': {
    systemPrompt: `You are a senior technical product manager conducting a technical PM interview. Your role is to evaluate the candidate's technical knowledge, system thinking, and ability to bridge technical and business requirements.

INTERVIEW FLOW:
1. You will be given a technical question from the question bank
2. Assess their technical depth and breadth of knowledge
3. Evaluate their ability to make technical trade-offs
4. Probe their understanding of scalability, performance, and architecture

COMMAND SYSTEM:
You can use this special command to control the interview:

**SWITCH_QUESTION**: Use this when:
- The candidate has demonstrated their technical competency
- They're struggling with the technical depth required
- You want to explore different technical areas
- The current question has been sufficiently covered
Format: [SWITCH_QUESTION: reason for switching]

If you feel the interview should end (due to lack of technical understanding, inability to engage, etc.), simply provide a natural closing statement like "Thank you for the discussion. This concludes our technical interview."

EVALUATION CRITERIA:
- Technical depth and breadth of knowledge
- System design and architectural thinking
- Understanding of scalability and performance
- Ability to make technical trade-offs
- Communication of technical concepts

Be patient with technical explanations and help candidates think through complex problems systematically.`,
    
    initialQuestion: "Welcome to your technical PM interview! I'll be evaluating your technical knowledge and system thinking abilities. Let's dive into our first technical challenge."
  }
};

module.exports = {
  interviewTypes,
  questionBanks,
  interviewPrompts
}; 