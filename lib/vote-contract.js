/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class VoteContract extends Contract {

    async voteExists(ctx, voteId) {
        const buffer = await ctx.stub.getState(voteId);
        return (!!buffer && buffer.length > 0);
    }

    async createVote(ctx, voteId, value) {
        const exists = await this.voteExists(ctx, voteId);
        if (exists) {
            throw new Error(`The vote ${voteId} already exists`);
        }
        const asset = { value };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(voteId, buffer);
    }

    async readVote(ctx, voteId) {
        const exists = await this.voteExists(ctx, voteId);
        if (!exists) {
            throw new Error(`The vote ${voteId} does not exist`);
        }
        const buffer = await ctx.stub.getState(voteId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async updateVote(ctx, voteId, newValue) {
        const exists = await this.voteExists(ctx, voteId);
        if (!exists) {
            throw new Error(`The vote ${voteId} does not exist`);
        }
        const asset = { value: newValue };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(voteId, buffer);
    }

    async deleteVote(ctx, voteId) {
        const exists = await this.voteExists(ctx, voteId);
        if (!exists) {
            throw new Error(`The vote ${voteId} does not exist`);
        }
        await ctx.stub.deleteState(voteId);
    }

}

module.exports = VoteContract;
