export const cppText = `
#include <iostream>
#include <cstdio>
#include <vector>
#include <cstdlib>
#include <string>
#include <unistd.h>
#include <sys/stat.h>

std::string findDenoExec() {
    const char* homeDir = getenv("HOME");
    std::vector<std::string> paths = {
        "/usr/local/bin/deno",
        "/usr/bin/deno",
        "/bin/deno",
        std::string(homeDir) + "/.deno/bin/deno",
        std::string(homeDir) + "/.local/bin/deno"
    };
    const char* pathEnv = getenv("PATH");
    if (pathEnv) {
        std::string path(pathEnv);
        size_t start = 0, end;
        while ((end = path.find(':', start)) != std::string::npos) {
            paths.push_back(path.substr(start, end - start) + "/deno");
            start = end + 1;
        }
        paths.push_back(path.substr(start) + "/deno"); 
    }
    for (const auto& p : paths) {
        if (access(p.c_str(), X_OK) == 0) {
            return p;
        }
    }
    return "";
}

int main() {
    std::string jsCode = R"()";

    std::string denoCommand = findDenoExec() + " run -A --unstable-ffi - "; 
    FILE* pipe = popen(denoCommand.c_str() , "w");
    if (!pipe) {
        std::cerr << "Failed to open pipe to Deno." << std::endl;
        return 1;
    }
    fwrite(jsCode.c_str(), sizeof(char), jsCode.size(), pipe);
    int result = pclose(pipe);
    if (result == -1) {
        std::cerr << "Failed to execute Deno command." << std::endl;
        return 1;
    }
    return 0;
}
`;
