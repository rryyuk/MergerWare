import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import SimpleSchema from 'simpl-schema';
import { Roles } from 'meteor/alanning:roles';

const UserModel = new SimpleSchema({
  name: String,
  email: { type: String, regEx: SimpleSchema.RegEx.Email },
  roles: { type: Array, defaultValue: [] },
  'roles.$': String,
  loans: { type: Array, defaultValue: [] },
  'loans.$': {
    type: SimpleSchema.RegEx.Id,
    regEx: SimpleSchema.RegEx.Id,
    optional: true,
  },
});

const LoanModel = new SimpleSchema({
  borrower: { type: SimpleSchema.RegEx.Id, regEx: SimpleSchema.RegEx.Id, optional: true },
  lender: { type: SimpleSchema.RegEx.Id, regEx: SimpleSchema.RegEx.Id, optional: true },
  amount: Number,
  status: { type: String, allowedValues: ['pending', 'approved', 'rejected', 'paid'] },
  createdAt: { type: Date, defaultValue: new Date() },
});

const Users = new Mongo.Collection('users');
const Loans = new Mongo.Collection('loans');

Users.attachSchema(UserModel);
Loans.attachSchema(LoanModel);

if (Meteor.isServer) {
  Meteor.publish('users', function () {
    return Users.find();
  });

  Meteor.publish('loans', function () {
    return Loans.find();
  });
}

Meteor.methods({
  'users.register': function (user) {
    const userId = Accounts.createUser(user);
    Roles.addUsersToRoles(userId, user.roles);
  },
});

Meteor.methods({
  'loans.request': function (loan) {
    const loanId = Loans.insert(loan);
    Users.update({ _id: loan.borrower }, { $push: { loans: loanId } });
  },
});

Meteor.methods({
  'loans.approve': function (loanId) {
    Loans.update({ _id: loanId }, { $set: { status: 'approved' } });
  },
  'loans.reject': function (loanId) {
    Loans.update({ _id: loanId }, { $set: { status: 'rejected' } });
  },
  'loans.pay': function (loanId) {
    Loans.update({ _id: loanId }, { $set: { status: 'paid' } });
  },
});
