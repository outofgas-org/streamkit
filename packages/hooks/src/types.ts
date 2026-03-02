export type SubscribeKey = string | readonly unknown[];

export type Unsubscribable = {
  unsubscribe: () => void;
};

export type UseSubscribeState<TData> = {
  data?: TData;
  ready: boolean;
  loading: boolean;
  error?: string;
};

export type UseSubscribeOptions<TRaw, TData = TRaw> = {
  key: SubscribeKey;
  enabled?: boolean;
  initialData?: TData;
  resetOnSubscribe?: boolean;
  select?: (raw: TRaw) => TData;
  subscribe: (handlers: {
    onData: (data: TRaw) => void;
    onError: (error: Error) => void;
  }) => Unsubscribable | Promise<Unsubscribable>;
};
