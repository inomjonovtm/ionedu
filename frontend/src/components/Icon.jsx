import {
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Play, PlayCircle, FileText, File, Star, Users, User, Clock, Video,
  Globe, Trophy, Award, BookOpen, Eye, Bell, Bookmark, Share2,
  Download, Upload, MapPin, Map, Search, Plus, Edit, MoreHorizontal,
  Settings, Check, CheckCircle2, X, Shield, AlertTriangle, Zap, Calendar,
  Link as LinkIcon, MessageSquare, Trash2, GripVertical,
  Grid3x3, List, Home, Send, Camera, Tv, Phone, Lock, BarChart3,
  Gamepad2, Flame, Target, Compass, LayoutGrid, GraduationCap,
  FolderOpen, Sliders, Mail, UserCog,
  Heart, Timer, Volume2, VolumeX, Sparkles, Crown, RotateCcw, Skull,
  Sun, Moon, MessageCircle, Image as ImageIcon, Pin, BadgeCheck, PenLine, Newspaper,
} from 'lucide-react'

const map = {
  arrowR: ArrowRight, arrowL: ArrowLeft,
  chevR: ChevronRight, chevL: ChevronLeft, chevD: ChevronDown, chevU: ChevronUp,
  play: Play, playC: PlayCircle, fileText: FileText, file: File,
  star: Star, starF: Star, users: Users, user: User, clock: Clock, video: Video,
  globe: Globe, trophy: Trophy, award: Award, book: BookOpen, bookmark: Bookmark,
  eye: Eye, bell: Bell, share: Share2, download: Download, upload: Upload,
  mapPin: MapPin, map: Map, search: Search, plus: Plus, edit: Edit,
  more: MoreHorizontal, settings: Settings, check: Check, checkC: CheckCircle2,
  x: X, shield: Shield, alert: AlertTriangle, zap: Zap, calendar: Calendar,
  link: LinkIcon, message: MessageSquare, trash: Trash2, drag: GripVertical,
  twitter: Send, instagram: Camera, youtube: Tv,
  grid: Grid3x3, list: List, home: Home, phone: Phone, lock: Lock,
  chart: BarChart3,
  gamepad: Gamepad2, flame: Flame, target: Target, compass: Compass,
  layout: LayoutGrid, grad: GraduationCap, folder: FolderOpen,
  sliders: Sliders, mail: Mail, userCog: UserCog,
  heart: Heart, timer: Timer, volume: Volume2, volumeOff: VolumeX,
  sparkles: Sparkles, crown: Crown, rotate: RotateCcw, skull: Skull,
  sun: Sun, moon: Moon, comment: MessageCircle, image: ImageIcon,
  pin: Pin, verified: BadgeCheck, pen: PenLine, news: Newspaper,
}

export default function Icon({ name, size = 16, fill = false, style, className }) {
  const C = map[name] || Star
  const isFilled = name === 'starF'
  return (
    <C
      size={size}
      style={style}
      className={className}
      fill={isFilled ? 'currentColor' : (fill ? 'currentColor' : 'none')}
      strokeWidth={2}
    />
  )
}
