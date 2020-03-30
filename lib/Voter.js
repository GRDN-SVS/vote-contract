'use-strict';

const Election = require('./Election.js');

class Voter {

    /**
     *
     * Voter
     *
     * Constructor for a Voter object. A Voter has an id, registrar id
     * first name, last name, and a ballot. 
     *  
     * @param voterId - the unique Id which corresponds to a registered voter
     * @param registrarId - the unique Id which corresponds to a registrar
     * @param election - an Election instance
     * @param firstName - first name of the voter
     * @param lastName - last name of the voter
     * @returns - a Voter instance
     */
    constructor(voterId, registrarId, election, firstName, lastName) {
        if (this.validateVoter(voterId) && this.validateRegistrar(registrarId) && Election.validateElection(election.electionId)) {
            // Attributes
            this.voterId = voterId;
            this.registrarId = registrarId;
            this.election = election;
            this.firstName = firstName;
            this.lastName = lastName;
            this.ballot = null;
            this.ballotCreated = false;

            this.type = 'voter';
            if (this.__isContract) {
                delete this.__isContract;
            }
            if (this.name) {
                delete this.name;
            }
            return this;
        }
        else if (!this.validateVoter(voterId)) {
            throw new Error('the voterId is not valid.');
        }
        else {
            throw new Error('the registrarId is not valid.');
        }

    }

    /**
     *
     * validateVoter
     *
     * check for valid ID number.
     *  
     * @param voterId 
     * @returns - true if valid Voter, false if invalid
     */
    async validateVoter(voterId) {
        //VoterId error checking here, i.e. check if valid drivers License, or state ID
        if (voterId) {
            return true;
        } else {
            return false;
        }
    }

    /**
     *
     * validateRegistrar
     *
     * check for valid registrarId, should be cross checked with government
     *  
     * @param voterId - an array of choices 
     * @returns - yes if valid Voter, no if invalid
     */
    async validateRegistrar(registrarId) {

        //registrarId error checking here, i.e. check if valid drivers License, or state ID
        if (registrarId) {
            return true;
        } else {
            return false;
        }
    }

}

module.exports = Voter;