export const followRequestQueryKeys = {
    all: ['followRequests'] as const,
    received: () => [...followRequestQueryKeys.all, 'received'] as const,
    receivedList: (filters: unknown) => [...followRequestQueryKeys.received(), { filters }] as const,
    sent: () => [...followRequestQueryKeys.all, 'sent'] as const,
    sentList: (filters: unknown) => [...followRequestQueryKeys.sent(), { filters }] as const,
};
