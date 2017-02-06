Meteor.users.allow({
    insert: function(userId, doc){
        return true;
    },
    update: function(userId, doc, fields, modifier){
        return true;
    },
    remove: function (userId, doc) {
        return true;
    }
});

Reports.allow({
    insert(Id, doc){
        return true;
    },
    update(Id, doc, fields, modifier){
        return true;
    },
    remove(Id, doc){
        return true;
    }
});

Draft.allow({
    insert(Id, doc){
        return false;
    },
    update(Id, doc, fields, modifier){
        return false;
    },
    remove(Id, doc){
        return false;
    }
});
