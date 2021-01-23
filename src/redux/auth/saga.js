// @flow
import { Cookies } from 'react-cookie';
import { all, call, fork, put, takeEvery } from 'redux-saga/effects';

import { fetchJSON } from '../../helpers/api';

import { LOGIN_USER, LOGOUT_USER, REGISTER_USER, FORGET_PASSWORD } from './constants';

import {
    loginUserSuccess,
    loginUserFailed,
    registerUserSuccess,
    registerUserFailed,
    forgetPasswordSuccess,
    forgetPasswordFailed,
} from './actions';

/**
 * Sets the session
 * @param {*} user
 */
const setSession = user => {
    let cookies = new Cookies();
    if (user) cookies.set('user', JSON.stringify(user), { path: '/' });
    else cookies.remove('user', { path: '/' });
};
/**
 * Login the user
 * @param {*} payload - username and password
 */
function* login({ payload: { username, password , type } }) {
    const options = {
        body: JSON.stringify({ userName:username, password }),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    };

    try {
				const response = yield call(fetchJSON, `https://dry-falls-55056.herokuapp.com/api/${type}/login`, options);
				if(response.massage === 'done'){
					let {token , id ,role } = response
					let responseJson= { token , id, role }
					localStorage.setItem('id',id)
					localStorage.setItem('token',token)
					localStorage.setItem('role',role)
					setSession({ ok: true, json: () => responseJson })					
					yield put(loginUserSuccess(response));
					return
				}
				throw response.massage 
    } catch (error) {
        let message;
        switch (error.status) {
            case 500:
                message = 'Internal Server Error';
                break;
            case 401:
                message = 'Invalid credentials';
                break;
            default:
                message = error;
        }
        yield put(loginUserFailed(message));
        setSession(null);
    }
}

/**
 * Logout the user
 * @param {*} param0
 */
function* logout({ payload: { history } }) {
    try {
        setSession(null);
        yield call(() => {
            history.push('/account/login');
        });
    } catch (error) {}
}

/**
 * Register the user
 */
function* register({ payload: { fullname, email, password } }) {
    const options = {
        body: JSON.stringify({ fullname, email, password }),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    };

    try {
        const response = yield call(fetchJSON, '/users/register', options);
        yield put(registerUserSuccess(response));
    } catch (error) {
        let message;
        switch (error.status) {
            case 500:
                message = 'Internal Server Error';
                break;
            case 401:
                message = 'Invalid credentials';
                break;
            default:
                message = error;
        }
        yield put(registerUserFailed(message));
    }
}

/**
 * forget password
 */
function* forgetPassword({ payload: { username } }) {
    const options = {
        body: JSON.stringify({ username }),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    };

    try {
        const response = yield call(fetchJSON, '/users/password-reset', options);
        yield put(forgetPasswordSuccess(response.message));
    } catch (error) {
        let message;
        switch (error.status) {
            case 500:
                message = 'Internal Server Error';
                break;
            case 401:
                message = 'Invalid credentials';
                break;
            default:
                message = error;
        }
        yield put(forgetPasswordFailed(message));
    }
}

export function* watchLoginUser() {
    yield takeEvery(LOGIN_USER, login);
}

export function* watchLogoutUser() {
    yield takeEvery(LOGOUT_USER, logout);
}

export function* watchRegisterUser() {
    yield takeEvery(REGISTER_USER, register);
}

export function* watchForgetPassword() {
    yield takeEvery(FORGET_PASSWORD, forgetPassword);
}

function* authSaga() {
    yield all([fork(watchLoginUser), fork(watchLogoutUser), fork(watchRegisterUser), fork(watchForgetPassword)]);
}

export default authSaga;
