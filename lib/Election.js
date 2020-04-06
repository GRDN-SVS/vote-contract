'use strict';

class Election {

    /**
     *
     * Election
     *
     * Constructor for an Election object. Specifies its name, start and end date.
     *  
     * @param name - the name of the election
     * @param electionId - the unique Id which corresponds to the election
     * @param startDate - Date object that indicates when the election starts
     * @param endDate - Date object that indicates when the election starts
     * @returns - Election instance
     */
    constructor(name, electionId, startDate, endDate) {
        this.electionId = electionId;
        if (this.validateElection(this.electionId)) {
            this.name = name;
            this.startDate = startDate;
            this.endDate = endDate;
            
            this.type = 'election';
            if (this.__isContract) {
                delete this.__isContract;
            }
            return this;
        }
        else {
            throw new Error('not a valid election!');
        }
    }

    /**
     *
     * validateElection
     *
     * check for valid election, cross check with database.
     *  
     * @param electionId
     * @returns - true if valid Election, false if invalid
     */
    async validateElection(electionId) {

        //registrarId error checking here, i.e. check if valid drivers License, or state ID
        if (electionId) {
            return true;
        } else {
            return false;
        }
    }

}

module.exports = Election;