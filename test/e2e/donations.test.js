const chai = require('chai');
const mongoose = require('mongoose');
const request = require('./request');
const assert = chai.assert;

describe('donation API', () => {
    beforeEach(() => mongoose.connection.dropDatabase());
    let token = '';
    beforeEach(() => {
        return request
            .post('/api/auth/signup')
            .send({
                email: 'teststaff@test.com',
                name: 'Test staff',
                password: 'password' 
            })
            .then(({ body }) => token = body.token);
    });

    let savedDropSite = null;
    const testDonations = [];
    const dropSite = {
        name: 'Northwest Mothers Milk Bank',
        address: '417 SW 117th Ave, Portland, OR 97225',
        hours: '8AM–4:30PM'
    };

    beforeEach(() => {

        return request.post('/api/dropSites')
            .set('Authorization', token)
            .send(dropSite)
            .then(({ body }) => savedDropSite = body);
    });

    beforeEach(() => {
        testDonations.push({quantity: 6, date: '2017-01-01', dropSite: savedDropSite._id});
        testDonations.push({quantity: 9, date: '2017-02-01', dropSite: savedDropSite._id});
        testDonations.push({quantity: 3, date: '2017-03-01', dropSite: savedDropSite._id});
    });

    it('Should save a donation with an id', () => {
        return request.post('/api/donations')
            .set('Authorization', token)
            .send(testDonations[1])
            .then(({ body }) => {
                const savedDonation = body;
                console.log('body in donation', body);
                assert.ok(savedDonation._id);
                assert.equal(savedDonation.quantity, testDonations[1].quantity);
                // assert.equal(savedDonation.date, testDonations[1].date);
                assert.ok(savedDonation.date);
                assert.equal(savedDonation.dropSite, testDonations[1].dropSite);
            });
    });

    it('Should get all saved donations', () => {
        const saveDonations = testDonations.map( donation => {
            return request.post('/api/donations')
                .set('Authorization', token)
                .send(donation)
                .then(({ body }) => body );
        });

        return Promise.all(saveDonations)
            .then(savedDonations => {
                return request.get('/api/donations')
                    .set('Authorization', token)
                    .then(({ body }) => {
                        const gotDonations = body.sort((a, b) => a._id < b._id);
                        savedDonations = savedDonations.sort((a, b) => a._id < b._id);
                        assert.deepEqual(savedDonations, gotDonations);
                    });
            });   
    });

    it('Should get a donation by id', ()=>{
        let donation;
        return request.post('/api/donations')
            .set('Authorization', token)
            .send(testDonations[1])
            .then(res => donation = res.body )
            .then(()=>{
                return request.get(`/api/donations/${donation._id}`)
                    .set('Authorization', token)
                    .then(res =>{
                        assert.deepEqual(res.body, donation);
                    });
            });
    });

    it('Should update a donation by id', () => {
        const badDonation = testDonations[1];
        let savedDonation = null; 
        return request.post('/api/donations')
            .set('Authorization', token)
            .send(badDonation)
            .then(({ body }) => savedDonation = body)
            .then(() => {
                badDonation.quantity = '11';
                return request.put(`/api/donations/${savedDonation._id}`)
                    .set('Authorization', token)
                    .send(badDonation);
            })
            .then(({ body }) => assert.deepEqual(body.nModified === 1, true));
    });

    it('Should delete a donation', () => {
        return request.post('/api/donations')
            .set('Authorization', token)
            .send(testDonations[1])
            .then(({ body }) => {
                const savedDonation = body;
                return request.delete(`/api/donations/${savedDonation._id}`)
                    .set('Authorization', token);
                
            })
            .then( ({ body }) => {
                assert.deepEqual(body, { removed: true });
                return request.get('/api/donations')
                    .set('Authorization', token)
                    .then( ({ body })=>{
                        assert.deepEqual(body, []);
                    });
            });
    });
});