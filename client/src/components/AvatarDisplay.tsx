import React from 'react';

interface Props {
  avatar: string;
  name: string;
  size?: number;
}

const AvatarDisplay: React.FC<Props> = ({ avatar, name, size = 40 }) => (
  <img
    className="avatar-img"
    src={avatar}
    alt={name}
    width={size}
    height={size}
    style={{ width: size, height: size }}
  />
);

export default AvatarDisplay;
