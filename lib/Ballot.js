'use strict';

class Ballot {

    /**
     *
     * Ballot
     *
     * Constructor for a Ballot object. This is what the point of the application is - create 
     * ballots, have a voter fill them out, and then tally the ballots. 
     *  
     * @param election - what election you are making ballots for
     * @param voterId - the unique Id which corresponds to a registered voter
     * @returns - Ballot instance
     */
    constructor(ctx, election, voterId) {
        if (this.validateBallot(ctx, voterId)) {
            this.election = election;
            this.voterId = voterId;
            this.ballotCast = false;
            this.ballotId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            this.type = 'ballot';
            if (this.__isContract) {
                delete this.__isContract;
            }
            if (this.name) {
                delete this.name;
            }
            return this;
        }
        else {
            throw new Error('a ballot has already been created for this voter');
        }
    }

    /**
     *
     * validateBallot
     *
     * check to make sure a ballot has not been created for this
     * voter.
     *  
     * @param voterId - the unique Id of a registered voter 
     * @returns - true if valid Voter, false if invalid
     */
    async validateBallot(ctx, voterId) {
        const buffer = await ctx.stub.getState(voterId);

        if (!!buffer && buffer.length > 0) {
            let voter = JSON.parse(buffer.toString());
            if (voter.ballotCreated) {
                // ballot has already been created for this voter
                return false;
            }
            else {
                return true;
            }
        } 
        else {
            // This ID is not registered to vote
            return false;
        }
    }
}

module.exports = Ballot;