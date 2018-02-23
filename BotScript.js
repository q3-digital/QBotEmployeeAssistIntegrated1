
//This file consists of the messages sent from the QBot - Integrated Employee Assistant to the user, as part of the conversation.

module.exports = { 

	intro: "Hi, I am QBot! I specialize in Employee Assistance, and will be glad to assist you.",
	mainMenuPrompt: "What would you like to know today?", //followed by buttons to choose between HR FAQ, PMO FAQ, or DocSearch
	
	//Prompts for user input
	HRPrompt: 'HR (Human Resources) has many policies. Which specific policy do you wish to know about?',
	PMOPrompt: 'The PMO (Project Management Office) handles the framework of ongoing projects. What would you like to know about the PMO?',
	DocSearchPrompt: 'Which type of document would you like to see?', //followed by buttons to choose between Case Studies or Technical Documents
	TechDocPrompt: "Which technical document would you like to see?",	//to specify Technical Documents (leading from previous prompt)
	
	//Messages to present results or resultant options to user
	FAQChoice: "Kindly select one of the following as per your curiosity.", //on multiple possibilities of FAQ Questions
	DocSearchLinks: "You may select your required document from the following - ", //on multiple possibilities in DocSearch result
	DocSearchResult: "Here is the link to your requested document: ", //on singular DocSearch result
	
	//on no result/response
	DocSearchNoResult: "I apologize I can't find any documents related to that search query right now, you can email us at pmo@q3tech.com for more information.",
	HRNoResult: "I apologize, I am unable to find an answer to that right now, for more information you can email us at hr@q3tech.com\n Do you wish to start again?",
	PMONoResult: "I apologize, I am unable to find an answer to that right now, for more information you can email us at pmo@q3tech.com\n Do you wish to start again?",
	
	//Follow-up after HR FAQ Dialog
	HRFallbackChoice: "Can I interest you in any other information from HR?", //Yes|No
	HRFallbackPrompt: "Which policy would you like to know about next?",
	
	//Follow-up after PMO FAQ Dialog
	PMOFallbackChoice: "Can I interest you in any other information from PMO?", //Yes|No
	PMOFallbackPrompt: "What would you like to know about next?",
	
	//Follow-up after DocSearch Dialog
	DocSearchFallbackChoice: "Would you like to see any other document?", //Yes|No
	DocSearchFallbackPrompt: 'Which type of document would you like to see next?',
	
	FinalConfirmationPrompt: "Have I been able to assist you with all your queries?", //Triggered if any fallback choice is responded wt 'No' by the user
	
	//End of Conversation
	finalMessage: "Thank you for using the QBot - Employee Assistant. Hope to help you out again!"
	
	
};