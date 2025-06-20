import axiosClient from "@/configs/axiosClient";
import { ISenderReq } from "@/interfaces";

export const fetchFriendListApi = async (userId: string) => {
    try {
        const response = await axiosClient.get("/user/friend-list/" + userId);
        return response.data
    } catch (error) {
        return {
            status: 400,
            message: error
        }
    }
}
export const fetchFriendRequestListApi = async (userId: string) => {
    try {
        const response = await axiosClient.get("/user/friend-requests/" + userId);
        return response.data
    } catch (error) {
        return {
            status: 400,
            message: error
        }
    }
}
export const changeFriendRequestStatusApi = async (requestId: string, sendReq: ISenderReq) => {
    try {
        const response = await axiosClient.put("/friendship/change-status-friend-request/" + requestId, sendReq);
        return response.data
    } catch (error) {
        return {
            status: 400,
            message: error
        }
    }
}

export const fetchNonFriendUsersApi = async (userId: string, token: string) => {
    try {
        const response = await axiosClient.get("/user/non-friends/" + userId, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response.data
    } catch (error) {
        return {
            status: 400,
            message: error
        }
    }
}

export const sendFriendRequestApi = async (senderId: string, receiverId: string) => {
    try {
        const response = await axiosClient.post("/friendship/requests", {
            senderId,
            receiverId
        });
        return response.data
    } catch (error) {
        return {
            status: 400,
            message: error
        }
    }
}