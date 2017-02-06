import blinds from "./static/blindslist";
import members from "./static/memberlist";
import * as DraftService from "./services/draft-service";
import nodeSchedule from 'node-schedule';

Meteor.startup(() => {
    //This will show in the run console not the browser console
    console.log("meteor started");

    var blindsList = blinds;
    var memberList = members;
    //console.log(blindsList);

    //var available = Available.find().fetch();
    //console.log('available',available);

    if(Blinds.find().count() ===0){
        blindsList.forEach((blind) => {
            Blinds.insert(blind);
        });
    };
    //Add admin account if no user exists
    if(Meteor.users.find().count()===0){
        console.log('no users found');
        var adminuser ={
            email:'admin@admin.com',
            password:'password',
            username:'admin',
            profile:{
                isAdmin:true,
                isMember:true
            }
        };
        Accounts.createUser(adminuser);

        memberList.forEach((member) => {
            Accounts.createUser(member);
        });

        function addStatus(){
            if(Meteor.users.find().count()!==0){
                memberList.forEach((member) =>{
                    var user = Meteor.users.findOne({"username":member.username});
                    Meteor.users.update(user._id,{
                        $set:{
                            "status":member.status
                        }
                    })
                });
            }
        }
        addStatus();

    };

    var draft = Draft.findOne({"status": "active"});
    if (draft) {
        var tracker = DraftTracker.findOne({"draft_id": draft._id});
        DraftService.setDraftTimer(tracker._id, tracker.timeLeft);
        DraftService.setDraftInterval(tracker._id);
        var draftId = draft._id;

    }

    //function runScheduler(){
    //    var endRule = new nodeSchedule.RecurrenceRule();
    //
    //    //Original
    //    endRule.dayOfWeek = [0, 3, 6];
    //    endRule.hour = 23;
    //    endRule.minute = 0;
    //
    //    //Testing
    //    //endRule.dayOfWeek = 5;
    //    //endRule.hour = 15;
    //    //endRule.minute = 38;
    //
    //    nodeSchedule.scheduleJob(endRule, Meteor.bindEnvironment(function(){
    //        var draft = Draft.findOne({"status": "open"});
    //        if (draft) {
    //            Scheduler.insert({
    //                "endTime": new Date()
    //            });
    //            var draftId = draft._id;
    //            DraftService.endDraft(draftId);
    //        }
    //    }));
    //
    //    //Begin cron start draft process
    //    var startRule =  new nodeSchedule.RecurrenceRule();
    //    //Sunday = 0, Wednesday = 3, Saturday = 6
    //    //hours in 24 hr time
    //
    //    ////Testing
    //    //startRule.dayOfWeek = [2];
    //    //startRule.hour = 16;
    //    //startRule.minute = 2;
    //
    //    //Original
    //    startRule.dayOfWeek = [0, 3, 6];
    //    startRule.hour = 5;
    //    startRule.minute = 0;
    //
    //    nodeSchedule.scheduleJob(startRule, Meteor.bindEnvironment(function() {
    //            console.log("Scheduler started");
    //            Scheduler.insert({
    //                "startTime": new Date()
    //            });
    //            DraftService.startDraft({});
    //        }));
    //};
    //
    //runScheduler();

});



