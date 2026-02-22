import React, { createContext, useContext, useState, useCallback } from "react";

export interface CartSeat {
  id: string;
  seat_number: string;
  show_id: string;
}

export interface CartSnack {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

interface CartState {
  selectedShow: { id: string; movie_title: string; show_time: string; screen: string } | null;
  seats: CartSeat[];
  snacks: CartSnack[];
}

interface CartContextType extends CartState {
  setSelectedShow: (show: CartState["selectedShow"]) => void;
  addSeat: (seat: CartSeat) => void;
  removeSeat: (seatId: string) => void;
  addSnack: (snack: Omit<CartSnack, "quantity">) => void;
  removeSnack: (snackId: string) => void;
  updateSnackQty: (snackId: string, qty: number) => void;
  getTotal: () => number;
  getSeatTotal: () => number;
  getSnackTotal: () => number;
  clearCart: () => void;
}

const SEAT_PRICE = 200;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedShow, setSelectedShow] = useState<CartState["selectedShow"]>(null);
  const [seats, setSeats] = useState<CartSeat[]>([]);
  const [snacks, setSnacks] = useState<CartSnack[]>([]);

  const addSeat = useCallback((seat: CartSeat) => {
    setSeats((prev) => [...prev, seat]);
  }, []);

  const removeSeat = useCallback((seatId: string) => {
    setSeats((prev) => prev.filter((s) => s.id !== seatId));
  }, []);

  const addSnack = useCallback((snack: Omit<CartSnack, "quantity">) => {
    setSnacks((prev) => {
      const existing = prev.find((s) => s.id === snack.id);
      if (existing) return prev.map((s) => (s.id === snack.id ? { ...s, quantity: s.quantity + 1 } : s));
      return [...prev, { ...snack, quantity: 1 }];
    });
  }, []);

  const removeSnack = useCallback((snackId: string) => {
    setSnacks((prev) => prev.filter((s) => s.id !== snackId));
  }, []);

  const updateSnackQty = useCallback((snackId: string, qty: number) => {
    if (qty <= 0) {
      setSnacks((prev) => prev.filter((s) => s.id !== snackId));
    } else {
      setSnacks((prev) => prev.map((s) => (s.id === snackId ? { ...s, quantity: qty } : s)));
    }
  }, []);

  const getSeatTotal = useCallback(() => seats.length * SEAT_PRICE, [seats]);
  const getSnackTotal = useCallback(() => snacks.reduce((sum, s) => sum + s.price * s.quantity, 0), [snacks]);
  const getTotal = useCallback(() => getSeatTotal() + getSnackTotal(), [getSeatTotal, getSnackTotal]);

  const clearCart = useCallback(() => {
    setSelectedShow(null);
    setSeats([]);
    setSnacks([]);
  }, []);

  return (
    <CartContext.Provider
      value={{ selectedShow, seats, snacks, setSelectedShow, addSeat, removeSeat, addSnack, removeSnack, updateSnackQty, getTotal, getSeatTotal, getSnackTotal, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
