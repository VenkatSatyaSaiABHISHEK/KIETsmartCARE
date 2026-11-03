import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export type WobnimoState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'working'
  | 'error'
  | 'celebrating'
  | 'surprised'
  | 'sad'
  | 'sleeping';

interface WobnimoMascotProps {
  character?: string;
  state?: WobnimoState;
  size?: number;
}

export function WobnimoMascot({
  character = 'boo',
  state = 'idle',
  size = 130,
}: WobnimoMascotProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' && webViewRef.current) {
      // Send message to update mascot state dynamically
      const script = `
        if (window.mascotEl) {
          window.mascotEl.setAttribute('state', '${state}');
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [state]);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.2/dist/wobnimo.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            background: transparent !important;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          wobnimo-mascot {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <wobnimo-mascot id="mascot" character="${character}" state="${state}"></wobnimo-mascot>
        <script>
          window.mascotEl = document.getElementById('mascot');
        </script>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <iframe
          srcDoc={html}
          style={{
            width: size,
            height: size,
            border: 'none',
            background: 'transparent',
            pointerEvents: 'none',
          }}
          title="Wobnimo Mascot"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={[styles.webview, { width: size, height: size }]}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scalesPageToFit={false}
        bounces={false}
        androidLayerType="hardware"
        containerStyle={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});

