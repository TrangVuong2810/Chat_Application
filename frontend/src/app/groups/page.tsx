"use client"

import DashboardLayout from "@/app/u/DashboardLayout";
import GroupsList from "@/components/group/GroupList";

const Page = () => {
    return (
        <DashboardLayout>
            <GroupsList />
        </DashboardLayout>
    );
}

export default Page;