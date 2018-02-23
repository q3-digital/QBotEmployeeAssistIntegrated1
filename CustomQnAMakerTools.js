"use strict";
var script = require('./BotScript');
var builder = require("botbuilder");
var CustomQnAMakerTools = (function () {
    function CustomQnAMakerTools() {
        this.lib = new builder.Library('customQnAMakerTools');
        this.lib.dialog('answerSelection', [
            function (session, args) {
                var qnaMakerResult = args;
                session.dialogData.qnaMakerResult = qnaMakerResult;
				//console.log("qnaMakerResult is: ");
				//console.log(qnaMakerResult);
                var questionOptions = [];
                qnaMakerResult.answers.forEach(function (qna) { questionOptions.push(qna.questions[0]); });
				//questionOptions = questionOptions+"|Other";
                var promptOptions = { listStyle: builder.ListStyle.button };
				session.send('(idea)');
                setTimeout(function(){builder.Prompts.choice(session, script.FAQChoice, questionOptions, promptOptions);}, 3*1000)
            },
            function (session, results) {
				var dept = session.userData.selection;
				//console.log(dept);
                var qnaMakerResult = session.dialogData.qnaMakerResult;
				var filteredResult = qnaMakerResult.answers.filter(function (qna) { return qna.questions[0] === results.response.entity; });
				var selectedQnA = filteredResult[0];
				//console.log("selectedQnA is: ");
				//console.log(selectedQnA);
				
				
				setTimeout(function(){session.send(selectedQnA.answer);}, 3*1000)
				switch (dept) {
					case 'Questions about HR Policies':
						session.endDialog();
						setTimeout(function(){session.beginDialog('HRFallback');},12*1000)
						break;
						//return session.beginDialog('hrqna');
					case 'Questions about PMO Policies':
						session.endDialog();
						setTimeout(function(){session.beginDialog('PMOFallback');},12*1000)
						break;
						//return session.beginDialog('pmqna');
				}
				session.endDialogWithResult(selectedQnA);
			}
			
                // The following ends the dialog and returns the selected response to the parent dialog, which logs the record in QnA Maker service
                // You can simply end the dialog, in case you don't want to learn from these selections using session.endDialog()
        ]);
    }
    CustomQnAMakerTools.prototype.createLibrary = function () {
        return this.lib;
    };
    CustomQnAMakerTools.prototype.answerSelector = function (session, options) {
        session.beginDialog('customQnAMakerTools:answerSelection', options || {});
    };
    return CustomQnAMakerTools;
}());
exports.CustomQnAMakerTools = CustomQnAMakerTools;