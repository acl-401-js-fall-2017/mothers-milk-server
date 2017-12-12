const chai = require('chai');
const mongoose = require('mongoose');
const request = require('./request');
const assert = chai.assert;
const adminToken = require('./adminToken');


describe.only('user API', () => {

    let token = '';
    beforeEach(() => mongoose.connection.dropDatabase());
    beforeEach(async() => token = await adminToken());

    const testUsers = [
        {
            name: 'Michele',
            hash: '12356',
            email: 'Michele@test.com',
            roles: ['admin'],
            password: 'Michele-Password'
        },
        {
            name: 'Shane',
            hash: 'abcdefg',
            email: 'Shane@test.com',
            roles: ['admin'],
            password: 'Shane-password'
        }

    ];
    

    it('Should save a user with id', () => {
        return request.post('/api/users')
            .set('Authorization', token)
            .send(testUsers[1])
            .then(({ body }) => {
                const { newUser } = body;
                assert.ok(newUser._id);
                assert.equal(newUser.name, testUsers[1].name);
            });
    });

    it('Should remove a user by id', () => {
        return request.post('/api/users')
            .set('Authorization', token)
            .send(testUsers[1])
            .then(({ body }) => {
                const { newUser } = body;
                return request.delete(`/api/users/${newUser._id}`)
                    .set('Authorization', token)
                    .then(({ body }) => {
                        assert.deepEqual(body, { removed: true });
                        return request.get(`/api/users/${newUser._id}`)
                            .set('Authorization', token);
                    })
                    .then(
                        () => { throw new Error('Unexpected successful response'); },
                        err => {
                            assert.equal(err.status, 404);
                        }
                    );
            });
    });

    it('Should get a user by id', () => {
        return request.post('/api/users')
            .set('Authorization', token)
            .send(testUsers[1])
            .then(({ body }) => {
                const { newUser }= body;
                return request.get(`/api/users/${newUser._id}`)
                    .set('Authorization', token)
                    .then(res => {
                        assert.deepEqual(res.body, newUser);
                    });
            });
    });

    it('Should get all users', () => {
        const saveUsers = testUsers.map(user => {
            return request.post('/api/users')
                .set('Authorization', token)
                .send(user)
                .then(res => res.body);
        });
        return Promise.all(saveUsers)
            .then(savedUsers => {
                return request.get('/api/users')
                    .set('Authorization', token)
                    .then(({ body }) => {
                        assert.equal(body.length, savedUsers.length);
                    });
            });
    });

    it('Should only update name field with non admin token', () => {
        let changeuser = {
            email: 'updatedEmail',
            name: 'updatedName',
            roles: ['updated roles']
        };
        let notAdminToken;
        return request.post('/api/users')
            .set('Authorization', token)
            .send(testUsers[0])
            .then(({ body })=> notAdminToken = body.token)
            .then(()=>{
                return request.put('/api/users/me')
                    .set('Authorization', notAdminToken)
                    .send(changeuser)
                    .then(({ body }) => {
                        assert.equal(body.name, 'updatedName');
                        assert.deepEqual(body.roles, testUsers[0].roles);
                        assert.equal(body.email, testUsers[0].email);
                    });
            });
    });
    

    it('updates the user by id', () => {
        let changeuser = {
            name: 'Michelle',
            hash: '123'
        };
        let saveduser = null;

        return request.post('/api/users')
            .set('Authorization', token)
            .send(testUsers[1])
            .then(({ body }) => saveduser = body.newUser)
            .then(() => {
                return request.put(`/api/users/${saveduser._id}`)
                    .set('Authorization', token)
                    .send(changeuser);
            })
            .then(({ body }) => assert.deepEqual(body.name, 'Michelle'));
    });
});