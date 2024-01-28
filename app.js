// create a new meteor application
meteor create loan-app
cd loan-app

// add necessary packages
meteor add accounts-ui
meteor add accounts-password
meteor add alanning:roles
meteor add react
meteor add react-helmet

// create a user model
const UserModel = {
  name: String,
  email: { type: String, regEx: SimpleSchema.RegEx.Email },
  roles: { type: Array, default: [] },
  'roles.$': String,
  loans: { type: Array, default: [] },
  'loans.$': {
    type: ObjectId,
    ref: 'Loan',
  },
};

// create a loan model
const LoanModel = {
  borrower: { type: ObjectId, ref: 'User' },
  lender: { type: ObjectId, ref: 'User' },
  amount: Number,
  status: { type: String, allowedValues: ['pending', 'approved', 'rejected', 'paid'] },
  createdAt: { type: Date, default: new Date() },
};

// create collections
Users = new Mongo.Collection('users');
Loans = new Mongo.Collection('loans');

// attach schema to collections
Users.attachSchema(new SimpleSchema(UserModel));
Loans.attachSchema(new SimpleSchema(LoanModel));

// publish data to client
if (Meteor.isServer) {
  Meteor.publish('users', function () {
    return Users.find();
  });

  Meteor.publish('loans', function () {
    return Loans.find();
  });
}

// create user registration method
Meteor.methods({
  'users.register': function (user) {
    const userId = Accounts.createUser(user);
    Roles.addUsersToRoles(userId, user.roles);
  },
});

// create loan request method
Meteor.methods({
  'loans.request': function (loan) {
    const loanId = Loans.insert(loan);
    const user = Users.findOne({ _id: loan.borrower });
    user.loans.push(loanId);
    Users.update({ _id: user._id }, { $set: { loans: user.loans } });
  },
});

// create loan approval/rejection/payment method
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
