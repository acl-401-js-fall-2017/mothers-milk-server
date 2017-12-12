const request = require('./request');
const mongoose = require('mongoose');
const assert = require('chai').assert;
const User = require('../../lib/models/user');
const tokenService = require('../../lib/utils/token-service');

describe('supplies API', () => {

    beforeEach(() => mongoose.connection.dropDatabase());
    let token = '';
    const suppliesTest = {
        bags: 9,
        boxes: 2,
        fulfilled: false
    };
    const supplyTwo = {
        bags: 1,
        boxes: 3,
        fulfilled: false
    };
    beforeEach(() => {
        const user = new User({
            email: 'teststaff@test.com',
            name: 'Test staff',
            roles: ['admin']
        });
        user.generateHash('password');
        return user.save()
            .then(user => {
                console.log('user', user);
                return tokenService.sign(user);
            })
            .then(signed => token = signed );
    });

    beforeEach(() => {
        return request.post('/api/users')
            .set('Authorization', token)
            .send({
                email: 'test@gmail.com',
                name: 'Michele',
                password: 'password',
                hash: '234'
            })
            .then(({ body }) => {
                supplyTwo.Donor = body.newUser._id;
            });
    });

    beforeEach(() => {
        return request.post('/api/users')
            .set('Authorization', token)
            .send({
                email: 'test2@gmail.com',
                name: 'Mich',
                password: 'password',
                hash: '235'
            })
            .then(({ body }) => {
                suppliesTest.Donor = body.newUser._id;
            });
    });

    

    it('saves with id', () => {
        
        return request.post('/api/supplies')
            .set('Authorization', token)
            .send(suppliesTest)
            .then(res => {
                const supplies = res.body;
                assert.ok(supplies._id);
                assert.equal(supplies.bags, suppliesTest.bags);
                assert.equal(supplies.boxes, suppliesTest.boxes);
                assert.equal(supplies.Donor, suppliesTest.Donor);
            });
    });

    it('deletes with id', () => {
        let supply = null;
        return request.post('/api/supplies')
            .send(suppliesTest)
            .then(res => {
                supply = res.body;
                return request.delete(`/api/supplies/${supply._id}`);
            })
            .then(res => {
                assert.deepEqual(res.body, { removed: true });
                return request.get(`/api/supplies/${supply._id}`);
            })
            .then(
                () => { throw new Error('Unexpected successful response'); },
                err => {
                    assert.equal(err.status, 404);
                }
            );
    });

    it('gets by id', () => {
        let supply = null;
        return request.post('/api/supplies')
            .send(suppliesTest)
            .then(res => {
                supply = res.body;
                return request.get(`/api/supplies/${supply._id}`);
            })
            .then(res => {
                assert.deepEqual(res.body, supply);
            });
    });

    it('get all supplies', () => {
        

        const posts = [suppliesTest, supplyTwo].map(supply => {
            return request.post('/api/supplies')
                .send(supply)
                .then(res => res.body);
        });

        let saved = null;
        return Promise.all(posts)
            .then(_saved => {
                saved = _saved;
                return request.get('/api/supplies');
            })
            .then(res => {
                assert.deepEqual(res.body, saved);
            });
    });

    it('updates the supplies by id', () => {
        
        let savedSupply = null;
        let changeSupplies = {
            bags: 9,
            boxes: 2,
            fulfilled: true
        };

        return request.post('/api/supplies')
            .send(suppliesTest)
            .then(({ body }) => savedSupply = body)
            .then(() => {
                changeSupplies.Donor = savedSupply.Donor;
                return request.put(`/api/supplies/${savedSupply._id}`)
                    .send(changeSupplies);
            })
            .then(({ body }) => {
                assert.deepEqual(body.fulfilled, true);
            });
    });
});
