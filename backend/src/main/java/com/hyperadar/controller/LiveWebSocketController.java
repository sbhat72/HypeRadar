package com.hyperadar.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
public class LiveWebSocketController {

    // TODO: implement WebSocket endpoints and message mapping

    public void broadcastUpdate() {
        // TODO: push updated hype scores to all connected WebSocket clients
        log.debug("broadcastUpdate called — WebSocket not yet implemented");
    }
}
