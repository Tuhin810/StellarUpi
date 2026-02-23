
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import SendMoney from '../pages/SendMoney';
import QRScanner from '../pages/QRScanner';
import Transactions from '../pages/Transactions';
import FamilyManager from '../pages/FamilyManager';
import SharedWallet from '../pages/SharedWallet';
import Profile from '../pages/Profile';
import ChatPage from '../pages/ChatPage';
import ReceiveMoney from '../pages/ReceiveMoney';
import GroupPage from '../pages/GroupPage';
import TransactionDetail from '../pages/TransactionDetail';
import AddMoney from '../pages/AddMoney';
import Withdraw from '../pages/Withdraw';
import PaymentLink from '../pages/PaymentLink';
import AutoPay from '../pages/AutoPay';
import SonicHandshake from '../pages/SonicHandshake';
import Subscribe from '../pages/Subscribe';
import Rewards from '../pages/Rewards';
import ClaimFunds from '../pages/ClaimFunds';
import Gullak from '../pages/Gullak';
import StreakPage from '../pages/StreakPage';
import Security from '../pages/Security';
import SchedulePay from '../pages/SchedulePay';

const AppRoutes: React.FC = () => {
    const { isAuthenticated, profile } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
            />

            {/* Public Payment Link - handles auth inside component */}
            <Route path="/pay/:stellarId" element={<PaymentLink />} />
            <Route path="/subscribe/:planId" element={<Subscribe />} />
            <Route path="/claim" element={<ClaimFunds />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard profile={profile!} />} />
                <Route path="/send" element={<SendMoney profile={profile!} />} />
                <Route path="/scan" element={<QRScanner />} />
                <Route path="/transactions" element={<Transactions profile={profile!} />} />
                <Route path="/transaction/:txId" element={<TransactionDetail profile={profile!} />} />
                <Route path="/family" element={<FamilyManager profile={profile!} />} />
                <Route path="/shared" element={<SharedWallet profile={profile!} />} />
                <Route path="/profile" element={<Profile profile={profile!} />} />
                <Route path="/receive" element={<ReceiveMoney profile={profile!} />} />
                <Route path="/group/:groupId" element={<GroupPage profile={profile!} />} />
                <Route path="/chat/:contactId" element={<ChatPage profile={profile!} />} />
                <Route path="/add-money" element={<AddMoney profile={profile!} />} />
                <Route path="/withdraw" element={<Withdraw profile={profile!} />} />
                <Route path="/autopay" element={<AutoPay profile={profile!} />} />
                <Route path="/sonic" element={<SonicHandshake profile={profile!} />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/gullak" element={<Gullak profile={profile!} />} />
                <Route path="/streak" element={<StreakPage />} />
                <Route path="/security" element={<Security profile={profile!} />} />
                <Route path="/schedule-pay" element={<SchedulePay profile={profile!} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;
