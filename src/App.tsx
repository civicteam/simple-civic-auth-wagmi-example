import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, useAccount, useConnect, useSendTransaction, http } from 'wagmi';
import { embeddedWallet, userHasWallet } from '@civic/auth-web3';
import { CivicAuthProvider, UserButton, useUser } from '@civic/auth-web3/react';
import { baseSepolia, polygonAmoy } from "wagmi/chains";
import { useEffect } from "react";

const CLIENT_ID = process.env.CLIENT_ID;
if (!CLIENT_ID) throw new Error('CLIENT_ID is required');

const wagmiConfig = createConfig({
  chains: [baseSepolia, polygonAmoy],
  transports: {
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
  connectors: [
    embeddedWallet({ debug: true }),
  ],
  ssr: true,
});

// Wagmi requires react-query
const queryClient = new QueryClient();

// Separate component for the app content that needs access to hooks
const AppContent = () => {
  const userContext = useUser();
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();

  const createWallet = () => {
    if (userContext && !userHasWallet(userContext)) {
      // once the wallet is created, we can connect it straight away
      return userContext.createWallet().then(connectExistingWallet);
    }
  };

  const connectExistingWallet = () => connect({
    connector: connectors[0]
  });

  const sendTx = () => sendTransaction({
    to: '0x...',
    value: 1000n,
  });

  useEffect(() => {
    console.log('userContext print', userContext);
  }, [userContext]);

  return (
    <>
      {!userHasWallet(userContext) &&
        <button onClick={createWallet}>Create Wallet</button>
      }
      {userContext && <UserButton />}
      {!isConnected ? (
        <button onClick={connectExistingWallet}>Connect Wallet</button>
      ) : (
        <button onClick={sendTx}>Send Transaction</button>
      )}
    </>
  );
};

// Main App component that sets up providers
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={CLIENT_ID}>
          <AppContent />
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default App;