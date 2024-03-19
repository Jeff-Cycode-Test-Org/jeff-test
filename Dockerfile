# Use Alpine Linux version 3.15.5 as the base image
FROM alpine:3.15.5

# Optional: Install additional packages using the package manager (apk)
# For example:
# RUN apk add --no-cache package1 package2

# Optional: Set environment variables
# ENV KEY=value

# Optional: Set working directory
# WORKDIR /path/to/working/directory

# Optional: Copy files into the container
COPY secret-test secret-test 

# Optional: Expose ports
# EXPOSE port_number

# Optional: Define default command to run when the container starts
# CMD ["executable", "param1", "param2"]

