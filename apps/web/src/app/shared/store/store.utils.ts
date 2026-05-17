import { create, UseBoundStore } from 'zustand/react';
import { type StateCreator, StoreApi } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware';

export interface StoreState<D extends object, A extends object> {
  readonly data: D;
  readonly actions: A;
}

export type Store<S extends StoreState<object, object>> = UseBoundStore<StoreApi<S>>;

export interface StoreInitializerOptions<S extends StoreState<object, object>> {
  readonly getState: StoreApi<S>['getState'];
  readonly setState: StoreApi<S>['setState'];
  readonly updateData: (data: S['data'] | ((data: S['data']) => Partial<S['data']>), action?: string) => void;
  readonly store: StoreApi<S>;
}

export function createStore<S extends StoreState<object, object>>(
  name: string,
  initializer: (options: StoreInitializerOptions<S>) => S,
): Store<S> {
  return create<S>(
    devtools<S>(
      (setState, getState, store): S => {
        const updateData = (data: S['data'] | ((data: S['data']) => Partial<S['data']>), action?: string) => {
          setState(
            (state: S): S => ({
              ...state,
              data: { ...state.data, ...(typeof data === 'function' ? data(state.data) : state.data) },
            }),
            undefined,
            action,
          );
        };

        return initializer({ getState, setState, updateData, store });
      },
      { name, enabled: true },
    ) as StateCreator<S>,
  );
}

export const storeActionsSelector = <S extends StoreState<object, object>>({ actions }: S): S['actions'] => actions;
