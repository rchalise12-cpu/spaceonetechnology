export type Section = { title: string; body: string };
export type PublicPage = {
	slug: string;
	kind:
		| 'standard'
		| 'services'
		| 'projects'
		| 'articles'
		| 'contact'
		| 'careers'
		| 'article'
		| 'project';
	eyebrow: string;
	title: string;
	intro: string;
	sections: Section[];
	cta?: string;
};
export const services = [
	{
		slug: 'technology-staffing',
		name: 'Technology staffing',
		line: 'The right people for the work ahead.',
		intro:
			'Great hiring starts with understanding the work. We help teams define the role, find relevant experience, and build a hiring process that respects everyone’s time.',
		sections: [
			{
				title: 'Start with the real requirements',
				body: 'We turn a broad job description into a clear hiring brief: the problems to solve, the tools that matter, and the experience a person needs to contribute. That gives your team a consistent way to evaluate candidates.'
			},
			{
				title: 'Keep the process moving',
				body: 'From candidate coordination to interview preparation and feedback, we help keep the small details from becoming long delays. You retain the hiring decision; we support the process around it.'
			},
			{
				title: 'Build a practical engagement',
				body: 'Discuss contract support, project staffing, or long-term hiring needs with us. We will agree on the scope, responsibilities, and commercial terms before work begins.'
			}
		]
	},
	{
		slug: 'custom-software-app-development',
		name: 'Software & app development',
		line: 'Useful software. Thoughtfully built.',
		intro:
			'Turn a business challenge into a product people can use with confidence. We connect product thinking, interface design, and engineering from the first working prototype to the next release.',
		sections: [
			{
				title: 'Find the smallest valuable release',
				body: 'We start with your users and the job they need to do. Together, we define the critical journey, identify the riskiest assumptions, and choose a release scope that can deliver useful feedback early.'
			},
			{
				title: 'Build for everyday use',
				body: 'Clear navigation, accessible interfaces, reliable APIs, and sensible data models are part of the work from the start. We make room for the edge cases that real users encounter.'
			},
			{
				title: 'Leave you with a maintainable product',
				body: 'Testing, deployment notes, ownership, and support expectations belong in the delivery plan. Your team should understand what was built and how to keep it working.'
			}
		]
	},
	{
		slug: 'crm-erp-solutions',
		name: 'CRM & ERP solutions',
		line: 'Connect the systems your business depends on.',
		intro:
			'Give sales, operations, and leadership a clearer shared view. We help shape workflows and integrations around the way your business actually runs.',
		sections: [
			{
				title: 'Map the work before the software',
				body: 'We review where information enters, who owns it, and which handoffs slow the team down. That process reveals where configuration is enough and where a focused integration is needed.'
			},
			{
				title: 'Make data easier to trust',
				body: 'Field definitions, validation, permissions, and migration checks help teams work from consistent information. We plan changes around the records and reports your business relies on.'
			},
			{
				title: 'Support adoption',
				body: 'A system is useful when people can use it. Clear workflows, practical documentation, and a deliberate rollout help your team make the transition.'
			}
		]
	},
	{
		slug: 'quality-assurance',
		name: 'Quality engineering',
		line: 'Confidence at every release.',
		intro:
			'Make testing part of delivery, with attention to the journeys that matter most to your customers and your business.',
		sections: [
			{
				title: 'Focus on meaningful risk',
				body: 'We identify critical user journeys, fragile integrations, and costly failure modes. The test plan follows those priorities rather than chasing a test count.'
			},
			{
				title: 'Test across the experience',
				body: 'Functional checks, API tests, accessibility review, and performance investigation reveal different kinds of problems. We choose the right mix for your product and release process.'
			},
			{
				title: 'Make quality repeatable',
				body: 'Reproducible environments, actionable bug reports, and automated checks help teams fix problems and prevent familiar failures from returning.'
			}
		]
	},
	{
		slug: 'workflow-automation',
		name: 'Workflow automation',
		line: 'Less repetition. More room for good work.',
		intro:
			'Replace repetitive handoffs with dependable workflows. We help you automate the right steps while keeping people in control of important decisions.',
		sections: [
			{
				title: 'Choose the right process',
				body: 'We look for frequent, well-understood tasks with clear inputs and outcomes. A small improvement to a daily workflow can be more valuable than a complicated automation nobody trusts.'
			},
			{
				title: 'Plan for exceptions',
				body: 'Retries, duplicate prevention, clear ownership, and a route for human review make automation resilient. The process should still make sense when an input is missing or a service is unavailable.'
			},
			{
				title: 'Measure the change',
				body: 'Agree on a baseline and a useful outcome before implementation. Time saved, fewer handoffs, and reduced rework are more informative than the number of automated steps.'
			}
		]
	},
	{
		slug: 'data-analytics',
		name: 'Data & analytics',
		line: 'A clearer picture. A better decision.',
		intro:
			'Bring scattered data into focus with practical pipelines, consistent definitions, and reports that answer the questions your team actually asks.',
		sections: [
			{
				title: 'Agree on what the numbers mean',
				body: 'We define the business questions, data sources, and calculations before building the dashboard. Shared definitions help prevent different teams from arriving at different answers.'
			},
			{
				title: 'Build a dependable foundation',
				body: 'Data validation, refresh schedules, permissions, and lineage make reporting easier to maintain. We surface missing or delayed information instead of giving incomplete data false certainty.'
			},
			{
				title: 'Design for a decision',
				body: 'A good report helps someone decide what to do next. We organize the most useful signals first, with enough context to investigate the details.'
			}
		]
	},
	{
		slug: 'cloud-devops',
		name: 'Cloud & DevOps',
		line: 'A steadier path from code to production.',
		intro:
			'Help your team release with confidence through repeatable environments, clear deployment workflows, and useful operational visibility.',
		sections: [
			{
				title: 'Make delivery repeatable',
				body: 'We review builds, configuration, secrets, and deployment steps to find the manual work that introduces avoidable risk. A clear pipeline makes releases easier to understand and recover.'
			},
			{
				title: 'Design around your workload',
				body: 'Architecture choices should reflect actual traffic, data needs, reliability expectations, and cost. We help weigh those tradeoffs before adding infrastructure.'
			},
			{
				title: 'Prepare for the day after launch',
				body: 'Monitoring, access controls, backup expectations, and incident ownership belong in the plan. Your team needs a way to see problems and respond.'
			}
		]
	},
	{
		slug: 'ai-business-tools',
		name: 'Applied AI',
		line: 'Start with a useful problem.',
		intro:
			'Explore where AI can support your team with search, classification, drafting, or analysis—backed by clear evaluation and human oversight.',
		sections: [
			{
				title: 'Define a bounded use case',
				body: 'We identify what the system should do, what it should never decide alone, and what a useful answer looks like. That boundary guides product design and implementation.'
			},
			{
				title: 'Evaluate before expanding',
				body: 'Representative examples, failure cases, and a measurable review process help test whether the tool is useful. A convincing demo is the beginning of evaluation, not its conclusion.'
			},
			{
				title: 'Keep people and data in view',
				body: 'Access controls, source visibility, review workflows, and clear data handling expectations help a team use AI thoughtfully in everyday work.'
			}
		]
	},
	{
		slug: 'managed-it-support',
		name: 'Managed technology support',
		line: 'Keep your technology moving with you.',
		intro:
			'Give your systems a clear support plan, with documented ownership and a practical way to prioritize fixes, maintenance, and improvements.',
		sections: [
			{
				title: 'Understand the environment',
				body: 'We review the applications, integrations, and infrastructure your team depends on. An agreed inventory and responsibility map make support requests easier to route.'
			},
			{
				title: 'Set clear expectations',
				body: 'Coverage hours, response expectations, escalation paths, and included work are defined in the engagement. Your team should know how to ask for help and what happens next.'
			},
			{
				title: 'Make space for improvement',
				body: 'Recurring issues often point to a deeper opportunity. We help turn support observations into a prioritized improvement plan.'
			}
		]
	}
];
export const projectIdeas = [
	[
		'worksync-ai-powered-team-collaboration-tool',
		'WorkSync',
		'Team collaboration',
		'A shared home for decisions, responsibilities, and follow-through.',
		'Scattered updates make it difficult to know what changed and who owns the next step.',
		'A focused workspace could bring project context, task ownership, and decision history into one place. AI-assisted summaries would link back to source material, with people reviewing important conclusions.',
		'Start with a single team’s weekly workflow. Evaluate whether people can find decisions faster and whether fewer tasks lose an owner.'
	],
	[
		'edumind-personalized-learning-hub',
		'EduMind',
		'Learning experience',
		'A learning path that makes the next lesson feel achievable.',
		'Learners need a way to understand their progress without getting lost in a catalog of content.',
		'A learning hub could connect short lessons, practice, and feedback around explicit goals. Recommendations would explain why a lesson is relevant and allow learners to choose a different path.',
		'Test comprehension and completion with representative learners, including accessible navigation and alternatives to timed exercises.'
	],
	[
		'medassist-virtual-health-companion',
		'MedAssist',
		'Care coordination',
		'Make preparation and follow-up easier to keep track of.',
		'Appointment details, preparation instructions, and follow-up tasks can arrive through disconnected channels.',
		'A coordination concept could organize appointments, questions for a clinician, and provider-supplied instructions. It would support communication rather than make clinical decisions.',
		'Validate the workflow with care teams and users. Sensitive information, accessibility, and clear boundaries would be essential before any real-world release.'
	],
	[
		'finvision-predictive-finance-dashboard',
		'FinVision',
		'Financial operations',
		'A clearer view of the assumptions behind a forecast.',
		'Financial planning becomes harder when figures and assumptions are separated across spreadsheets.',
		'A planning dashboard could connect historical data, scenario inputs, and transparent calculations. Users would be able to compare scenarios and trace a figure back to its source.',
		'Begin with one planning decision and reconcile every calculation. Forecasts would be presented as scenarios with assumptions, not promises.'
	],
	[
		'retailsense-smart-store-analytics',
		'RetailSense',
		'Retail analytics',
		'Bring store performance into context.',
		'A sales total says little about the inventory, staffing, and demand patterns behind it.',
		'A retail analytics concept could connect product availability and sales trends in a focused operational view, with clear refresh times and consistent metric definitions.',
		'Pilot the view against existing reports and test whether store teams can identify an actionable exception more quickly.'
	],
	[
		'novahire-ai-recruitment-platform',
		'NovaHire',
		'Recruitment operations',
		'A more organized experience for candidates and coordinators.',
		'Candidate communication and application details often spread across email, files, and trackers.',
		'A recruitment workspace could organize job details, submissions, documents, interviews, and shared updates. Any AI assistance would remain reviewable, with people responsible for hiring decisions.',
		'Test the complete candidate journey, especially permissions, document privacy, and the accuracy of imported job information.'
	],
	[
		'greentrack-sustainable-supply-chain-monitor',
		'GreenTrack',
		'Supply chain visibility',
		'Understand where your information comes from.',
		'Supplier information is difficult to compare when methods, dates, and supporting evidence differ.',
		'A supply chain concept could organize supplier records, data provenance, and reported indicators, while making missing evidence visible.',
		'Agree on definitions and validation rules with domain specialists. Reporting should distinguish measured data, estimates, and unknowns.'
	],
	[
		'travelmate-intelligent-trip-planner',
		'TravelMate',
		'Travel planning',
		'A trip plan that leaves room for real life.',
		'Bookings, preferences, and daily plans are often stored in different places.',
		'A travel planning concept could bring itineraries and user preferences together, with editable suggestions and clear links to current provider information.',
		'Test changes, cancellations, accessibility needs, and offline access. Prices and availability would always need confirmation with the provider.'
	],
	[
		'legalease-ai-contract-analyzer',
		'LegalEase',
		'Document workflows',
		'Find the clause. Keep the context.',
		'Reviewing long documents is slower when questions and relevant passages are separated.',
		'A document review concept could support search, annotations, and source-linked summaries. Qualified reviewers would remain responsible for interpretation and decisions.',
		'Evaluate source accuracy and access controls with appropriate professionals before handling real documents. The tool would support review, not replace professional judgment.'
	]
].map(([slug, name, category, line, problem, approach, validation]) => ({
	slug,
	name,
	category,
	line,
	sections: [
		{ title: 'The problem worth exploring', body: problem },
		{ title: 'A possible approach', body: approach },
		{ title: 'How we would validate it', body: validation }
	]
}));
export const articles: PublicPage[] = [
	{
		slug: '3-campaigns-that-bombed-and-why-were-proud',
		title: 'What a disappointing launch can teach a product team',
		intro: 'A weak launch is useful only when the team turns it into a better decision.',
		sections: [
			{
				title: 'Separate the signal from the story',
				body: 'When a launch underperforms, start with what people actually did. Did they reach the product, understand the value, complete the first task, and return? Each step suggests a different problem. Avoid explaining the result with a single persuasive anecdote.'
			},
			{
				title: 'Look for a testable assumption',
				body: 'Perhaps the audience was too broad, the first experience asked too much, or the promise did not match the product. Turn that observation into a small test with an expected outcome and a time to review it.'
			},
			{
				title: 'Keep the learning close to the work',
				body: 'Record the original assumption, the evidence, and the decision. The point of a retrospective is to change the next release, not to create a document nobody opens.'
			}
		]
	},
	{
		slug: 'how-custom-apps-transform-businesses',
		title: 'When custom software is worth building',
		intro:
			'The strongest reason to build is a specific problem that existing tools cannot solve well.',
		sections: [
			{
				title: 'Begin with the cost of the current process',
				body: 'List the handoffs, duplicate entries, delays, and workarounds your team encounters. Understand who is affected and how often. That gives you a concrete basis for comparing a custom application with a simpler process change.'
			},
			{
				title: 'Consider configuration first',
				body: 'A well-configured existing product may be enough. Custom software becomes more compelling when the workflow is distinctive, the integration needs are significant, or the experience is central to your business.'
			},
			{
				title: 'Budget for ownership',
				body: 'Building is one part of the decision. Include support, security updates, documentation, and future changes in the plan. A smaller application with clear ownership is easier to sustain than a broad one without it.'
			}
		]
	},
	{
		slug: 'why-your-logo-doesnt-matter-and-what-does',
		title: 'Your brand is also how your product behaves',
		intro:
			'Visual identity matters. The everyday experience is what makes that identity believable.',
		sections: [
			{
				title: 'Keep the promise consistent',
				body: 'A confident homepage and a confusing signup form tell different stories. Review the journey from first impression to completed task. Language, navigation, support, and error messages all contribute to how people understand your business.'
			},
			{
				title: 'Design the less glamorous moments',
				body: 'An empty state, a delayed response, or a failed payment can shape trust more than a polished hero image. Tell people what happened, what remains safe, and what they can do next.'
			},
			{
				title: 'Create a usable system',
				body: 'Shared typography, spacing, color, and interaction patterns help a team make consistent decisions. A design system works best when it explains behavior as clearly as appearance.'
			}
		]
	},
	{
		slug: 'the-hidden-bias-in-ai-driven-marketing',
		title: 'Ask better questions of AI-assisted decisions',
		intro:
			'Useful automation needs a clear purpose, representative evaluation, and a way for people to intervene.',
		sections: [
			{
				title: 'Examine the inputs',
				body: 'A system can repeat the patterns in its examples and data. Ask who is represented, what is missing, and whether the labels reflect the decision you actually want to support.'
			},
			{
				title: 'Evaluate across situations',
				body: 'An average score can hide uneven performance. Review examples across relevant user groups and contexts, and document where the system is unreliable. Keep sensitive decisions under appropriate human control.'
			},
			{
				title: 'Make review part of the workflow',
				body: 'People need enough context to question an output. Source visibility, clear limitations, and a way to correct a result are product requirements, not optional extras.'
			}
		]
	},
	{
		slug: 'how-ai-is-reshaping-software-development',
		title: 'Where AI fits in a thoughtful engineering workflow',
		intro: 'A faster first draft is useful when a team still knows how to verify the result.',
		sections: [
			{
				title: 'Choose work that can be checked',
				body: 'Drafting test cases, explaining unfamiliar code, and suggesting implementation options can be useful starting points. Define the acceptance criteria before relying on the output.'
			},
			{
				title: 'Keep the review focused on behavior',
				body: 'Generated code still needs to fit the architecture, respect permissions, handle failure, and be maintainable. Review the actual change and exercise the important paths rather than treating fluent explanations as evidence.'
			},
			{
				title: 'Protect context and ownership',
				body: 'Agree on which tools and data are appropriate for the project. Keep a person responsible for the decision to merge and release, with enough understanding to support the code later.'
			}
		]
	},
	{
		slug: 'how-mobile-apps-improve-customer-loyalty-and-brand-trust',
		title: 'Build a mobile experience people have a reason to keep',
		intro: 'A place on someone’s phone is earned through usefulness, clarity, and restraint.',
		sections: [
			{
				title: 'Give the app a recurring purpose',
				body: 'Identify the task that brings someone back: checking progress, managing a booking, or accessing something they need. If the same task works well on the web, consider whether a separate app adds enough value.'
			},
			{
				title: 'Respect attention',
				body: 'Notifications should arrive for a reason the user understands. Let people choose what they receive, and make the path from notification to useful action short.'
			},
			{
				title: 'Make control visible',
				body: 'Clear account settings, understandable permissions, and predictable behavior help people feel in control. Trust grows when the product works as expected and makes mistakes easy to recover from.'
			}
		]
	},
	{
		slug: 'cloud-based-applications-as-the-new-normal',
		title: 'Choose a cloud architecture around the work it must do',
		intro: 'Start with the workload and operating expectations before choosing services.',
		sections: [
			{
				title: 'Write down the requirements',
				body: 'Traffic patterns, data location, integration needs, and recovery expectations shape architecture. A small internal tool and a high-volume public service may need very different designs.'
			},
			{
				title: 'Make costs understandable',
				body: 'Identify what drives usage and how you will observe it. Include storage, data transfer, background work, and operational effort in the comparison. Simpler systems are often easier to reason about.'
			},
			{
				title: 'Practice the recovery path',
				body: 'A deployment plan should include rollback, configuration management, and the steps to restore service. Test those procedures before an incident makes them urgent.'
			}
		]
	},
	{
		slug: 'top-ux-mistakes-that-can-kill-your-app',
		title: 'Five small UX decisions that create unnecessary friction',
		intro:
			'Most frustrating experiences are made of ordinary problems repeated at the wrong moment.',
		sections: [
			{
				title: 'Make the next action clear',
				body: 'Competing primary buttons, vague labels, and hidden navigation make simple tasks harder. Give each screen a clear purpose and use words that describe the action.'
			},
			{
				title: 'Handle empty, loading, and error states',
				body: 'A blank screen leaves people guessing. Explain what is happening, preserve their input, and offer a useful next step when something goes wrong.'
			},
			{
				title: 'Respect different ways of using the product',
				body: 'Keyboard access, visible focus, readable contrast, and clear labels help more people complete a task. Test with realistic content and a narrow screen, not only the ideal desktop view.'
			},
			{
				title: 'Ask for information when it is needed',
				body: 'Long forms and early permission requests can interrupt progress. Explain why a field matters and avoid asking for details that the task does not require.'
			},
			{
				title: 'Keep behavior consistent',
				body: 'If the same action behaves differently across screens, people must relearn the product. Shared components and clear interaction rules reduce that burden.'
			}
		]
	},
	{
		slug: 'the-role-of-mobile-applications-in-digital-marketing',
		title: 'Connect your marketing promise to the product experience',
		intro: 'Acquisition and product design work best when they lead to the same useful outcome.',
		sections: [
			{
				title: 'Carry the context into the first session',
				body: 'The message that brought a person to the product should help them understand what to do next. Use a clear destination and avoid sending every campaign to an unrelated generic screen.'
			},
			{
				title: 'Measure meaningful progress',
				body: 'An install or a visit is only an early signal. Define the first valuable action and look for where people lose momentum on the way to it.'
			},
			{
				title: 'Make retention a product question',
				body: 'People return when a product remains useful. Improve the core task, remove recurring friction, and let communication support that value rather than compensate for its absence.'
			}
		]
	}
].map((a) => ({ ...a, kind: 'article' as const, eyebrow: 'FIELD NOTES' }));
export const standardPages: PublicPage[] = [
	{
		slug: 'about',
		kind: 'standard',
		eyebrow: 'ABOUT SPACE ONE',
		title: 'Good technology starts with people.',
		intro:
			'We bring technology work and career opportunity into the same conversation. For businesses, that means practical support for building and growing. For candidates, it means a more organized way to take the next step.',
		sections: [
			{
				title: 'Understand the work',
				body: 'A useful solution starts with a good question. We take time to understand the people, processes, and constraints behind a request before choosing a tool or proposing a team.'
			},
			{
				title: 'Make the next step clear',
				body: 'Clear scope, honest communication, and visible progress make work easier to manage. We favor practical decisions that help people move forward with confidence.'
			},
			{
				title: 'Build a working relationship',
				body: 'From a focused software engagement to a candidate’s next interview, our work depends on context and follow-through. We aim to make both easier to keep track of.'
			}
		]
	},
	{
		slug: 'company/team',
		kind: 'standard',
		eyebrow: 'HOW WE WORK TOGETHER',
		title: 'Different disciplines. One shared direction.',
		intro:
			'Useful technology takes more than code. Our work brings product thinking, design, engineering, and candidate coordination around a clear outcome.',
		sections: [
			{
				title: 'Product & delivery',
				body: 'Shape the problem, define a useful scope, and keep decisions connected to the people who depend on the result.'
			},
			{
				title: 'Design & experience',
				body: 'Make complex tasks easier to understand through clear language, accessible interfaces, and consistent interactions.'
			},
			{
				title: 'Engineering & quality',
				body: 'Build dependable applications and integrations, test the important behavior, and plan for operation after launch.'
			},
			{
				title: 'Talent & coordination',
				body: 'Keep candidate information, job opportunities, and interview communication organized so the next step is clear.'
			}
		]
	},
	{
		slug: 'engagements',
		kind: 'standard',
		eyebrow: 'A PRACTICAL WAY TO START',
		title: 'The right scope for your next move.',
		intro:
			'Some teams need a focused project. Others need an ongoing partner or the right person to join the work. We shape the engagement around the need.',
		sections: [
			{
				title: 'A focused project',
				body: 'For a defined problem with a clear outcome. We agree on deliverables, acceptance criteria, milestones, and a handover plan before implementation.'
			},
			{
				title: 'Ongoing technology support',
				body: 'For a product or operation that needs regular attention. We define priorities, coverage, included work, and a cadence for reviewing progress.'
			},
			{
				title: 'Talent support',
				body: 'For teams building capacity. We clarify the role, relevant experience, hiring process, and engagement terms before candidate coordination begins.'
			},
			{
				title: 'Clear terms before commitment',
				body: 'Pricing depends on scope, timeline, and the skills involved. Contact us with your needs for a tailored proposal; no fixed package should force you into work you do not need.'
			}
		]
	},
	{
		slug: 'resources/candidate-roadmap',
		kind: 'standard',
		eyebrow: 'YOUR PREPARATION GUIDE',
		title: 'Be ready for the conversation you want.',
		intro:
			'A strong search is built from small, repeatable habits. Use this guide to prepare honestly, stay organized, and follow through.',
		sections: [
			{
				title: '01 / Make it easy to reach you',
				body: 'Use an email address and phone number you check regularly. Set a professional voicemail, confirm your timezone, and keep those details consistent across your resume and profile.'
			},
			{
				title: '02 / Tell a consistent story',
				body: 'Keep one accurate professional profile. Describe your experience, skills, and contributions truthfully, with specific examples you can explain in an interview.'
			},
			{
				title: '03 / Tailor the resume',
				body: 'Read the role carefully. Highlight relevant experience and measurable work you can substantiate. Save the exact PDF you submit on the job page so you can refer to it later.'
			},
			{
				title: '04 / Prepare your introduction',
				body: 'Practice a brief introduction that connects your experience to the role. Explain what you do, a relevant example, and what you want to contribute next.'
			},
			{
				title: '05 / Refresh the fundamentals',
				body: 'Use the job description to choose the concepts and tools to review. Practice explaining your approach, assumptions, and tradeoffs, not just recalling definitions.'
			},
			{
				title: '06 / Prepare concrete examples',
				body: 'Choose a few real projects and be ready to explain the problem, your contribution, the result, and what you learned. Be precise about your own work.'
			},
			{
				title: '07 / Treat the recruiter call as a conversation',
				body: 'Clarify responsibilities, location, work arrangements, timeline, and any requirements that affect your fit. Ask questions early instead of making assumptions.'
			},
			{
				title: '08 / Set up the interview',
				body: 'Confirm the time and timezone, test the meeting link, and choose a quiet setting. Add the appointment and preparation tasks to your workspace.'
			},
			{
				title: '09 / Record what happened',
				body: 'After applying, update the status and save your confirmation screenshot. After an interview, record the outcome, questions, and agreed next steps.'
			},
			{
				title: '10 / Follow through thoughtfully',
				body: 'Use the timeline the recruiter shared. Keep follow-ups concise and specific, and continue preparing for other opportunities while you wait.'
			}
		]
	},
	{
		slug: 'privacy',
		kind: 'standard',
		eyebrow: 'YOUR INFORMATION',
		title: 'Privacy, in plain language.',
		intro:
			'The Space One workspace stores the information you provide to organize your job search and support candidate coordination.',
		sections: [
			{
				title: 'What the workspace stores',
				body: 'Account details include your name, email, phone, profile, and timezone. The workspace also stores job application statuses, resumes, screenshots, comments, tasks, and interview details that you or authorized staff add. Contact form submissions include the information entered in the form.'
			},
			{
				title: 'Who can access it',
				body: 'Clients can access their own application records and the jobs shared with them. Authorized staff and administrators can access candidate records to provide support. Administrators manage account access. Employer application sites are separate services with their own privacy practices.'
			},
			{
				title: 'How the application uses information',
				body: 'Information supports account access, invitations, job coordination, and operational reporting. Session cookies keep you signed in. This application does not include advertising trackers. Transactional emails are used for invitations and account recovery.'
			},
			{
				title: 'Your choices and requests',
				body: 'You can update your profile and remove uploaded documents from the workspace. To request an account export, account closure, or help with information you cannot change, contact Space One using the contact page. Records may need to be retained for applicable operational or legal requirements.'
			}
		]
	},
	{
		slug: 'terms',
		kind: 'standard',
		eyebrow: 'WORKSPACE GUIDELINES',
		title: 'A shared space. Clear expectations.',
		intro:
			'Use the Space One workspace to organize opportunities, communicate constructively, and keep an accurate record of your search.',
		sections: [
			{
				title: 'Keep your information accurate',
				body: 'Provide truthful profile and application information. Upload documents you are authorized to share, and keep account credentials and invitation links private.'
			},
			{
				title: 'Understand the application process',
				body: 'A job listing is an opportunity to explore, not a promise of employment. Apply through the employer’s website and verify current requirements, compensation, and availability there. Updating a status in this workspace does not submit an application to an employer.'
			},
			{
				title: 'Respect the shared workspace',
				body: 'Comments should relate to the application and remain professional. Do not upload malicious files, impersonate another person, or attempt to access records you are not authorized to view.'
			},
			{
				title: 'Ask when something is unclear',
				body: 'Contact Space One if you find an inaccurate listing, need help with your account, or have a question about a service engagement. Separate written engagement terms govern paid services.'
			}
		]
	},
	{
		slug: 'image-credits',
		kind: 'standard',
		eyebrow: 'VISUAL CREDITS',
		title: 'A note on our imagery.',
		intro:
			'Selected photography has been carried forward from the Space One Technology website to keep a connection with the company’s existing visual identity.',
		sections: [
			{
				title: 'Website photography',
				body: 'The collaboration image and contact portrait originate from the existing spaceonetechnology.com media library. They are used as illustrative photography and are not presented as portraits of named employees or proof of a specific client engagement.'
			},
			{
				title: 'Design & interface',
				body: 'The interface uses DM Sans and Lucide icons. Layouts, diagrams, and the workspace identity are implemented directly in the site, with a shared typography and color system.'
			}
		]
	}
];
export const collectionPages: PublicPage[] = [
	{
		slug: 'services',
		kind: 'services',
		eyebrow: 'WHAT WE CAN HELP WITH',
		title: 'Move the work forward.',
		intro:
			'Build something useful. Connect what you already have. Find the people who can take it further.',
		sections: []
	},
	{
		slug: 'projects',
		kind: 'projects',
		eyebrow: 'IDEAS IN PRACTICE',
		title: 'Explore what better could look like.',
		intro:
			'A collection of product concepts across industries. Each explores a practical problem, a possible approach, and what we would need to validate—not a claim of completed client results.',
		sections: []
	},
	{
		slug: 'insights',
		kind: 'articles',
		eyebrow: 'FIELD NOTES',
		title: 'A little perspective for the work ahead.',
		intro: 'Practical thinking on software, design, data, and the decisions that connect them.',
		sections: []
	},
	{
		slug: 'contact',
		kind: 'contact',
		eyebrow: 'LET’S TALK',
		title: 'What are you working toward?',
		intro:
			'Tell us where you are, what you need, and what a good next step would look like. We’ll help you find a practical place to begin.',
		sections: []
	},
	{
		slug: 'careers',
		kind: 'careers',
		eyebrow: 'YOUR NEXT CHAPTER',
		title: 'Your experience deserves a clear next step.',
		intro:
			'Explore opportunities, prepare for conversations, and keep your search organized with support from Space One.',
		sections: [
			{
				title: 'Find the roles worth your attention',
				body: 'Your workspace brings job details, requirements, and the employer’s application link together. Read the full role and decide where your experience can make a meaningful contribution.'
			},
			{
				title: 'Keep the details together',
				body: 'Save the resume you use, record your application, and add proof of submission. When the conversation moves forward, keep interview times and follow-up tasks alongside the job.'
			},
			{
				title: 'Stay connected to your team',
				body: 'Share updates and questions on an application so your coordinator has the context to help. Your search stays yours, with a clearer way to manage the work around it.'
			}
		]
	}
];
export const publicPages: PublicPage[] = [
	...standardPages,
	...collectionPages,
	...services.map((s) => ({
		slug: `services/${s.slug}`,
		kind: 'standard' as const,
		eyebrow: s.name.toUpperCase(),
		title: s.line,
		intro: s.intro,
		sections: s.sections
	})),
	...projectIdeas.map((p) => ({
		slug: `projects/${p.slug}`,
		kind: 'project' as const,
		eyebrow: `PRODUCT CONCEPT / ${p.category.toUpperCase()}`,
		title: p.name,
		intro: p.line,
		sections: p.sections
	})),
	...articles.map((a) => ({ ...a, slug: `insights/${a.slug}` }))
];
export const legacyRoutes: Record<string, string> = {
	home: '/',
	'home-two': '/',
	'about-us': '/about',
	'our-team': '/company/team',
	'our-services': '/services',
	'our-projects': '/projects',
	'blog-page': '/insights',
	contacts: '/contact',
	'prices-page': '/engagements',
	'job-openings': '/careers',
	'elementor-58374': '/careers',
	'data-analyst-onboarding-roadmap': '/resources/candidate-roadmap',
	spacecalander: '/interviews',
	'my-account': '/dashboard',
	shop: '/services',
	cart: '/services',
	checkout: '/contact',
	'author-page': '/company/team',
	...Object.fromEntries(articles.map((a) => [a.slug, `/insights/${a.slug}`])),
	...Object.fromEntries(
		[
			'sara-thompson',
			'daniel-foster',
			'liam-carter',
			'ryan-chen',
			'maya-brooks',
			'ethan-white'
		].map((s) => [`profiles/${s}`, '/company/team'])
	)
};
