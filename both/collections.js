//Create or initialize collections here note that the schema or model is done in start up js so not exposed to client

//static blinds collection should not be updated after create
Blinds = new Mongo.Collection('blinds');

//Reports will be same as above except for adding date field
Reports = new Mongo.Collection('reports');

Draft = new Mongo.Collection('draft');

DraftTracker = new Mongo.Collection('draft_tracker');

Scheduler = new Mongo.Collection('scheduler');

