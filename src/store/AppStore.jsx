import axios from 'axios';
import { createContext, useContext, useEffect, useReducer } from 'react';

const API_URL = '/api';

const AppContext = createContext();

const initialState = {
    profiles: [],
    currentProfile: null,
    currentMemberId: null, // Track which member is logged in
    is_admin: false,
    balances: {},
    settlements: [],
    isLoading: false,
    error: null
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_PROFILE':
            return {
                ...state,
                currentProfile: action.payload.group,
                currentMemberId: action.payload.member_id || state.currentMemberId,
                is_admin: action.payload.is_admin !== undefined ? action.payload.is_admin : state.is_admin,
                isLoading: false,
                error: null
            };
        case 'SET_SETTLEMENTS':
            return {
                ...state,
                settlements: action.payload,
                isLoading: false
            };
        case 'SET_BALANCES':
            return {
                ...state,
                balances: action.payload,
                isLoading: false
            };
        case 'LOGOUT':
            return { ...state, currentProfile: null, currentMemberId: null, is_admin: false };
        default:
            return state;
    }
};

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
        try {
            const stored = localStorage.getItem('spiltbill_session');
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    ...initial,
                    currentProfile: parsed.currentProfile,
                    currentMemberId: parsed.currentMemberId,
                    is_admin: parsed.is_admin || false
                };
            }
        } catch (e) {
            console.error("Failed to recover session", e);
        }
        return initial;
    });

    useEffect(() => {
        if (state.currentProfile) {
            localStorage.setItem('spiltbill_session', JSON.stringify({
                currentProfile: state.currentProfile,
                currentMemberId: state.currentMemberId,
                is_admin: state.is_admin
            }));
            // Optional: Refresh data on load (stale-while-revalidate)
            // But we can't call actions.refreshProfile here easily because actions depend on dispatch
        } else {
            // If logged out (currentProfile is null), clear storage
            localStorage.removeItem('spiltbill_session');
        }
    }, [state.currentProfile, state.currentMemberId, state.is_admin]);

    // ... (createProfile, joinGroup, addMember, addReceipt remain same)

    const refreshProfile = async () => {
        if (!state.currentProfile) return;
        try {
            const res = await axios.get(`${API_URL}/groups/${state.currentProfile.id}/`);
            // We only update the group data, preserving member_id and is_admin from current state
            dispatch({
                type: 'SET_PROFILE',
                payload: {
                    group: res.data,
                    member_id: state.currentMemberId,
                    is_admin: state.is_admin
                }
            });
            // Also fetch financial data
            fetchBalances();
            fetchSettlements();
        } catch (e) {
            console.error("Failed to refresh profile", e);
        }
    };

    const createProfile = async (name, pin, creatorName) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // 1. Create Group (Backend now handles creator member creation)
            const groupRes = await axios.post(`${API_URL}/groups/`, {
                name,
                pin,
                creator_name: creatorName
            });

            const group = groupRes.data;
            const member = group.members.find(m => m.name === creatorName);

            dispatch({
                type: 'SET_PROFILE',
                payload: { group, member_id: member?.id, is_admin: true }
            });
        } catch (e) {
            console.error(e);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to create group' });
        }
    };

    const joinGroup = async (publicId, name, pin) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await axios.post(`${API_URL}/groups/join/${publicId}/`, {
                name,
                pin
            });
            dispatch({ type: 'SET_PROFILE', payload: res.data });
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.error || 'Invalid PIN or Group ID';
            dispatch({ type: 'SET_ERROR', payload: msg });
        }
    };

    const addMember = async (name) => {
        if (!state.currentProfile) return;
        try {
            await axios.post(`${API_URL}/members/`, { group: state.currentProfile.id, name });
            refreshProfile();
        } catch (e) {
            console.error(e);
        }
    };

    const addReceipt = async (total, payerId, split, imageFile) => {
        if (!state.currentProfile) return;
        try {
            const receiptRes = await axios.post(`${API_URL}/receipts/`, {
                group: state.currentProfile.id,
                payer_id: payerId,
                total,
                split_data: split.map(id => ({ member_id: id, weight: 1 }))
            });

            if (imageFile) {
                const imageForm = new FormData();
                imageForm.append('image', imageFile);
                await axios.patch(`${API_URL}/receipts/${receiptRes.data.id}/`, imageForm);
            }

            refreshProfile();
        } catch (e) {
            console.error(e);
        }
    };

    const getGroupDetails = async (publicId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await axios.get(`${API_URL}/groups/public/${publicId}/`);
            dispatch({ type: 'SET_LOADING', payload: false });
            return res.data;
        } catch (e) {
            dispatch({ type: 'SET_ERROR', payload: 'Group not found' });
            return null;
        }
    };

    const updateGroupId = async (newPublicId) => {
        if (!state.currentProfile || !state.currentMemberId) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await axios.patch(`${API_URL}/groups/${state.currentProfile.id}/update_public_id/`, {
                member_id: state.currentMemberId,
                public_id: newPublicId
            });
            // Update local state with new public_id
            const updatedGroup = { ...state.currentProfile, public_id: res.data.public_id };
            dispatch({
                type: 'SET_PROFILE',
                payload: {
                    group: updatedGroup,
                    member_id: state.currentMemberId,
                    is_admin: state.is_admin // We need to track is_admin in state
                }
            });
            return true;
        } catch (e) {
            const msg = e.response?.data?.error || 'Failed to update Group ID';
            dispatch({ type: 'SET_ERROR', payload: msg });
            return false;
        }
    };

    const fetchSettlements = async () => {
        if (!state.currentProfile) return;
        try {
            const res = await axios.get(`${API_URL}/groups/${state.currentProfile.id}/settlements/`);
            dispatch({ type: 'SET_SETTLEMENTS', payload: res.data });
        } catch (e) {
            console.error("Failed to fetch settlements", e);
        }
    };

    const fetchBalances = async () => {
        if (!state.currentProfile) return;
        try {
            const res = await axios.get(`${API_URL}/groups/${state.currentProfile.id}/balances/`);
            dispatch({ type: 'SET_BALANCES', payload: res.data });
        } catch (e) {
            console.error("Failed to fetch balances", e);
        }
    };

    return (
        <AppContext.Provider value={{
            state,
            dispatch,
            currentProfile: state.currentProfile,
            currentMemberId: state.currentMemberId,
            actions: { createProfile, joinGroup, addMember, addReceipt, refreshProfile, getGroupDetails, updateGroupId, fetchSettlements, fetchBalances, logout: () => dispatch({ type: 'LOGOUT' }) }
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppStore = () => useContext(AppContext);
