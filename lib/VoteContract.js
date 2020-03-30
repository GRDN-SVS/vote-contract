/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

const Election = require('./Election.js');
const Voter = require('./Voter.js');
const Ballot = require('./Ballot.js');

class VoteContract extends Contract {

    /**
     *
     * init
     *
     * This function creates voters and gets the application ready for use by creating 
     * an election from the data files in the data directory.
     * 
     * @param ctx - the context of the transaction
     * @returns - the voters which are registered and ready to vote in the election
     */
    async init(ctx) {
        let voters = [];
        let elections = [];
        let election;

        // query for election first before creating one.
        let currElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));

        if (currElections.length === 0) {
            // TODO: Connect to database to get the elections

            //Nov 3 is election day
            let electionStartDate = await new Date(2020, 11, 3);
            let electionEndDate = await new Date(2020, 11, 4);

            //create the election
            election = await new Election('Mejor profesor de la carrera', '1234',
                electionStartDate, electionEndDate);

            //update elections array
            elections.push(election);

            await ctx.stub.putState(election.electionId, Buffer.from(JSON.stringify(election)));

        }
        else {
            election = currElections[0];
        }

        //create voters
        let voter1 = await new Voter('V1', '234', election, 'Rafael', 'Villegas');
        let voter2 = await new Voter('V2', '345', election, 'Isabela', 'Muriel');

        //update voters array
        voters.push(voter1);
        voters.push(voter2);

        //add the voters to the world state, the election class checks for registered voters 
        await ctx.stub.putState(voter1.voterId, Buffer.from(JSON.stringify(voter1)));
        await ctx.stub.putState(voter2.voterId, Buffer.from(JSON.stringify(voter2)));

        //generate ballots for all voters
        for (let i = 0; i < voters.length; i++) {
            if (!voters[i].ballot) {
                //give each registered voter a ballot
                await this.generateBallot(ctx, election, voters[i]);
            }
            else {
                // these voters already have ballots
                break;
            }

        }
        return voters;
    }

    /**
     *
     * generateBallot
     *
     * Creates a ballot in the world state, and updates voter ballot and castBallot properties.
     * 
     * @param ctx - the context of the transaction
     * @param election - the election we are generating a ballot for. All ballots are the same for an election.
     * @param voter - the voter object
     * @returns - nothing - but updates the world state with a ballot for a particular voter object
     */
    async generateBallot(ctx, election, voter) {
        let ballot = await new Ballot(ctx, election, voter.voterId);

        //set reference to voters ballot
        voter.ballot = ballot.ballotId;
        voter.ballotCreated = true;

        //update state with ballot object we just created
        await ctx.stub.putState(ballot.ballotId, Buffer.from(JSON.stringify(ballot)));
        await ctx.stub.putState(voter.voterId, Buffer.from(JSON.stringify(voter)));
    }

    /**
     *
     * createVoter
     *
     * Creates a voter in the world state, based on the args given.
     *  
     * @param args.voterId - the Id the voter, used as the key to store the voter object
     * @param args.registrarId - the registrar the voter is registered for
     * @param args.election - an election instance
     * @param args.firstName - first name of voter
     * @param args.lastName - last name of voter
     * @returns - nothing - but updates the world state with a voter
     */
    async createVoter(ctx, args) {
        args = JSON.parse(args);

        let currElection = args.election;
        //create a new voter
        let newVoter = await new Voter(args.voterId, args.registrarId, currElection, args.firstName, args.lastName);
        //update state with new voter
        await ctx.stub.putState(newVoter.voterId, Buffer.from(JSON.stringify(newVoter)));

        if (!await this.voteExists(ctx, currElection.elecionId)) {
            let response = {};
            response.error = 'not a valid election!';
            return response;
        }

        await this.generateBallot(ctx, currElection, newVoter);

        let response = `voter with voterId ${newVoter.voterId} has been successfully registered`;
        return response;
    }

    /**
     *
     * castVote
     * 
     * Checks that a particular voterId has not voted before, and then 
     * checks if it is a valid election time.
     * 
     * @param args.electionId - the electionId of the election we want to vote in
     * @param args.voterId - the voterId of the voter that wants to vote
     * @returns nothing - but updates the world state with a casted ballot
     */
    async castVote(ctx, args) {
        args = JSON.parse(args);

        //check to make sure the election exists
        let electionExists = await this.voteExists(ctx, args.electionId);

        if (electionExists) {
            //make sure we have an election
            let electionAsBytes = await ctx.stub.getState(args.electionId);
            let election = await JSON.parse(electionAsBytes);
            let voterAsBytes = await ctx.stub.getState(args.voterId);
            let voter = await JSON.parse(voterAsBytes);

            if (voter.ballotCast) {
                let response = {};
                response.error = 'this voter has already cast this ballot!';
                return response;
            }

            //check the date of the election, to make sure the election is still open
            let currentTime = await new Date(2020, 11, 3); // TODO: change to actully get current date

            //parse date objects
            let parsedCurrentTime = await Date.parse(currentTime);
            let electionStart = await Date.parse(election.startDate);
            let electionEnd = await Date.parse(election.endDate);

            //only allow vote if the election has started and hasn't finished
            if (parsedCurrentTime >= electionStart && parsedCurrentTime < electionEnd) {
                // make sure this voter cannot vote again! 
                voter.ballotCast = true;

                //update state to say that this voter has voted
                await ctx.stub.putState(voter.voterId, Buffer.from(JSON.stringify(voter)));
                let response = `voter with voterId ${voter.voterId} has successfully voted`;
                return response;
            }
            else {
                let response = {};
                response.error = 'the election is not open right now!';
                return response;
            }
        }
        else {
            let response = {};
            response.error = 'the election does not exist!';
            return response;
        }
    }

    /**
     * Query by the main objects in this app: ballot, election, and voter. 
     * Return all key-value pairs of a given type. 
     *
     * @param {Context} ctx the transaction context
     * @param {String} objectType the type of the object - should be either ballot, election or Voter
     */
    async queryByObjectType(ctx, objectType) {
        let queryString = {
            selector: {
                type: objectType
            }
        };

        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    }

    /**
     * Evaluate a queryString
     *
     * @param {Context} ctx the transaction context
     * @param {String} queryString the query string to be evaluated
    */
    async queryWithQueryString(ctx, queryString) {
        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let allResults = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                }
                catch (err) {
                    jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                await resultsIterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    async deleteVote(ctx, voteId) {
        const exists = await this.voteExists(ctx, voteId);
        if (!exists) {
            throw new Error(`The asset ${voteId} does not exist!`);
        }
        await ctx.stub.deleteState(voteId);
    }

    async readVote(ctx, voteId) {
        const exists = await this.voteExists(ctx, voteId);
        if (!exists) {
            let response = {};
            response.error = `The asset ${voteId} does not exist!`;
            return response;
        }
        const buffer = await ctx.stub.getState(voteId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async voteExists(ctx, voteId) {
        const buffer = await ctx.stub.getState(voteId);
        return (!!buffer && buffer.length > 0);
    }

}

module.exports = VoteContract;
