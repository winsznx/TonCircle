import { Address } from '@ton/core';

/**
 * Storage structure for GroupVault contract
 */
export interface GroupStorage {
    groupId: number;
    adminAddress: Address;
    memberAddresses: Map<string, boolean>;
    totalMembers: number;
    createdAt: number;
    isActive: boolean;
}

/**
 * Storage structure for individual Expense
 */
export interface Expense {
    expenseId: number;
    payerAddress: Address;
    totalAmount: bigint;
    description: string;
    timestamp: number;
    splits: Map<string, bigint>;
    settledBy: Map<string, boolean>;
}

/**
 * Storage structure for ExpenseSplitter contract
 */
export interface ExpenseSplitterStorage {
    groupId: number;
    expenses: Map<number, Expense>;
    expenseCount: number;
    netBalances: Map<string, bigint>;
}

/**
 * Storage structure for individual Goal
 */
export interface Goal {
    goalId: number;
    title: string;
    targetAmount: bigint;
    currentAmount: bigint;
    recipientAddress: Address;
    deadline: number;
    isPublic: boolean;
    contributors: Map<string, bigint>;
    status: GoalStatus;
    createdAt: number;
}

/**
 * Goal status enum
 */
export enum GoalStatus {
    Active = 0,
    Funded = 1,
    Completed = 2,
    Refunded = 3,
}

/**
 * Storage structure for GoalContract
 */
export interface GoalContractStorage {
    groupId: number;
    goals: Map<number, Goal>;
    goalCount: number;
}

/**
 * Frontend types for API/UI
 */
export interface ExpenseCreateRequest {
    amount: string; // in TON
    description: string;
    participants: string[]; // addresses
    splitType: 'equal' | 'custom';
    customSplits?: { [address: string]: string };
}

export interface GoalCreateRequest {
    title: string;
    targetAmount: string; // in TON
    recipientAddress: string;
    deadline: number; // Unix timestamp
    isPublic: boolean;
}

export interface ContributionRequest {
    goalId: number;
    amount: string; // in TON
}

export interface PaymentRequest {
    expenseId: number;
    amount: string; // in TON
}

/**
 * Response types
 */
export interface ExpenseResponse {
    expenseId: number;
    payer: string;
    amount: string;
    description: string;
    timestamp: number;
    participants: ParticipantSplit[];
    isSettled: boolean;
}

export interface ParticipantSplit {
    address: string;
    amount: string;
    isPaid: boolean;
}

export interface GoalResponse {
    goalId: number;
    title: string;
    targetAmount: string;
    currentAmount: string;
    recipientAddress: string;
    deadline: number;
    isPublic: boolean;
    status: GoalStatus;
    progress: number; // percentage
    contributors: Contributor[];
}

export interface Contributor {
    address: string;
    amount: string;
}

export interface BalanceResponse {
    address: string;
    balance: string; // net balance (positive = owed to you, negative = you owe)
    currency: 'TON';
}
