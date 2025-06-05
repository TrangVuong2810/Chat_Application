import axiosClient from "@/configs/axiosClient";

export const fetchConversationsByUserIdApi = async (userId: string) => {
    try {
        const response = await axiosClient.get("/conversation/by-userId/" + userId);
        return response.data
    } catch (error) {
        return null
    }
}
export const fetchConversationByIdApi = async (conversationId: string) => {
    try {
        const response = await axiosClient.get("/conversation/by-id/" + conversationId);
        return response.data
    } catch (error) {
        return null
    }
}

export const createGroupConversationApi = async (participants: string[], groupName: string) => {
  try {
    const response = await axiosClient.post(
      `/conversation/create-group?groupName=${encodeURIComponent(groupName)}`,
      { participants },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const addGroupMembersApi = async (conversationId: string, newMemberIds: string[]) => {
  try {
    const response = await axiosClient.post(
      `/conversation/group/${conversationId}/add-members`,
      newMemberIds,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const removeGroupMemberApi = async (conversationId: string, memberId: string) => {
  try {
    const response = await axiosClient.post(
      `/conversation/group/${conversationId}/remove-member/${memberId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const fetchAllGroupConversationsApi = async () => {
  try {
    const response = await axiosClient.get("/conversation/group-conversations");
    return response.data;
  } catch (error) {
    return null;
  }
};

export const joinGroupConversationApi = async (groupId: string) => {
  try {
    const response = await axiosClient.post(
      `/conversation/group/${groupId}/join`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error joining group:', error);
    return null;
  }
};