const request = require('./request');
const mongoose = require('mongoose');
const assert = require('chai').assert;
const adminToken = require('./adminToken');


describe('supplies API', () => {

    let token = '';
    beforeEach(() => mongoose.connection.dropDatabase());
    beforeEach(async() => token = await adminToken());

    const testData = [
        {
            email: 'testDonor@gmail.com',
            name: 'Test Donor',
            password: 'password',
            address: '222 test dr., Portland, OR 97229',
            hash: '234',
            roles: ['donor']
        },
        {
            bags: 9,
            boxes: 2,
            fulfilled: false
        },
        {
            bags: 1,
            boxes: 3,
            fulfilled: true
        }
    ];

    beforeEach(() => {
        return request.post('/api/users')
            .set('Authorization', token)
            .send(testData[0])
            .then(({ body }) => {
                testData[1].donor = body.newUser._id;
                testData[2].donor = body.newUser._id;  
            });
    });

    it('Should save a supply with id', () => {
        return request.post('/api/supplies')
            .set('Authorization', token)
            .send(testData[1])
            .then(({ body }) => {
                assert.ok(body._id);
                assert.equal(body.bags, testData[1].bags);
                assert.equal(body.boxes, testData[1].boxes);
                assert.equal(body.donor, testData[1].donor);
            });
    });

    it('Should delete a spply with id', () => {
        return request.post('/api/supplies')
            .send(testData[1])
            .then(({ body: supply }) => {
                return request.delete(`/api/supplies/${supply._id}`)
                    .then(({ body: res }) => {
                        assert.deepEqual(res, { removed: true });
                        return request.get(`/api/supplies/${supply._id}`);
                    })
                    .then(
                        () => { throw new Error('Unexpected successful response'); },
                        err => {
                            assert.equal(err.status, 404);
                        }
                    );
            });
    });

    it('Should get a supply by id', () => {
        return request.post('/api/supplies')
            .send(testData[1])
            .then(({ body: supply }) => {
                return request.get(`/api/supplies/${supply._id}`)
                    .then(({ body: gotSupply}) => {
                        assert.equal(gotSupply._id, supply._id);
                    });
            });
    });

    it('Should get all supplies', () => {
        const testSupplies = [testData[1], testData[2]].map(supply => {
            return request.post('/api/supplies')
                .send(supply)
                .then(({ body }) => body);
        });

        return Promise.all(testSupplies)
            .then(savedTestSupplies => {
                return request.get('/api/supplies')
                    .then(({ body: gotSupplies }) => {
                        assert.equal(gotSupplies.length, savedTestSupplies.length);
                    });
            });
    });

    it('Should update a supply by id', () => {
        return request.post('/api/supplies')
            .send(testData[1])
            .then(({ body: savedSupply}) => savedSupply)
            .then(savedSupply => {
                return request.put(`/api/supplies/${savedSupply._id}`)
                    .send(testData[2]);
            })
            .then(({ body: updatedSupply }) => {
                assert.deepEqual(updatedSupply.bags, testData[2].bags);
                assert.deepEqual(updatedSupply.boxes, testData[2].boxes);
                assert.deepEqual(updatedSupply.fulfilled, testData[2].fulfilled);
            });
    });
    
});
