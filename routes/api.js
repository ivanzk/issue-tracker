/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI;

module.exports = function (app) {
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

  const issueSchema = new mongoose.Schema({ 
    issue_title: {
      type: String,
      required: true
    },
    issue_text: {
      type: String,
      required: true
    },
    created_by: {
      type: String,
      required: true
    },
    assigned_to: {
      type: String
    },
    status_text: {
      type: String
    },
    open: {
      type: Boolean,
      default: true
    }
  }, {
    timestamps: {
      createdAt: 'created_on',
      updatedAt: 'updated_on'
    } 
  });
  
  const projectSchema = new mongoose.Schema({
    project: String,
    issues: [issueSchema]
  });
  
  const IssueTracker = mongoose.model('IssueTracker', projectSchema);
   
  
  app.route('/api/issues/:project')
    .get(function (req, res){
      const projectName = req.params.project;
      const queries = Object.entries(req.query);
      
      IssueTracker.findOne({project: projectName}, (err, project) => {
        if (err) {
          res.send('something went wrong');
          return console.error(err);
        }

        const issues = (!queries.length && project.issues) || project.issues
          .filter(issue => {
            return queries.every(q => issue[q[0]].toString() === q[1]);
          })

        res.json(issues.map(issue => issue));
      });

    })
    
    .post(function (req, res){
      const projectName = req.params.project;
      const issue = req.body;

      IssueTracker.findOne({project: projectName}, (err, project) => {
        if (err) {
          res.send('something went wrong');
          return console.error(err);
        }
            
        if (!project) {
          const newProject = new IssueTracker({project: projectName});
          newProject.issues.push(issue);
          newProject.save((err, project) => {
            if (err) {
              res.send('missing inputs');
              return console.error(err);
            }

            res.json(project.issues[project.issues.length - 1]);
          });
        } else {
          project.issues.push(issue);
          project.save((err, project) => {
            if (err) {
              res.send('missing inputs');
              return console.error(err);
            }

            res.json(project.issues[project.issues.length - 1]);
          });
        }
      });
      
    })
    
    .put(function (req, res){
      const project = req.params.project;
      const issueId = req.body._id
      const issueUpdate = Object.entries(req.body).filter(field => field[1]);

      if (issueUpdate.length <= 1) {
        res.send('no updated field sent');
        return;
      }
    
      IssueTracker.findOne({project: project}, (err, project) => {
        const issue = project.issues.find(issue => issue._id == issueId);
        
        issueUpdate.forEach(newValues => issue[newValues[0]] = newValues[1]);
        
        project.save((err, project) => {
          if (err) {
          res.send('could not update ' + issueId);
          return console.error(err);
        }
          res.send('successfully updated');
        });
      });
      
    })
    
    .delete(function (req, res){
      const project = req.params.project;
      const issueId = req.body._id;
    
      if (!issueId) {
        res.send('_id error');
        return console.error('_id error');
      }
    
      IssueTracker.findOne({project: project}, (err, project) => {
        if (err) {
          res.send('something went wrong');
          return console.error(err);
        }

        project.issues.pull({_id: issueId});
        
        project.save((err, project) => {
          res.send('deleted ' + issueId);
        });
      });
    });
    
};
