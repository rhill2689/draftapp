
Meteor.publish('users', function(){
   return Meteor.users.find({},{fields:{"status":1, _id:1, "username":1, "emails":1, "profile":1}}); // :1 means include :0 means exclude
});

Meteor.publish('draft', function() {
    return Draft.find(
        {
            status: {"$in": ["active", "open"]}
        },
        {
            fields: {
                "status": 1,
                "startDate": 1,
                "blinds": 1,
                "selections": 1,
                "order": 1,
                "currentPick": 1
            }
        }
    );
});

Meteor.publish('draftTracker', function() {
    return DraftTracker.find({},
        {
            fields: {
                "draft_id": 1,
                "startDate": 1,
                "end": 1,
                "timeLeft": 1,
                "count": 1,
                "userId": 1,
                "audit":1
            }
        }
    );
});

Meteor.publish('reports', function(){
   return Reports.find({},
       {
           fields: {
               "draftId":1,
               "selections":1,
               "draftDate":1
       }})
});

Meteor.publish('scheduler', function(){
    return Scheduler.find({},{
        fields:{
            "endTime":1,
            "startTime":1
        }
    })
})