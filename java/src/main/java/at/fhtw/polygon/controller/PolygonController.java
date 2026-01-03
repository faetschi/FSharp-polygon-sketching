package at.fhtw.polygon.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PolygonController {

    @GetMapping("/")
    public String index() {
        return "index";
    }
}
